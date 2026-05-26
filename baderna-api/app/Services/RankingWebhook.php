<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posta (e atualiza) o "Placar de Liderança da Baderna" no Discord.
 *
 * Strategy: na primeira chamada, faz POST com ?wait=true pra receber o
 * message_id de volta. Guarda em app_settings. Nas próximas chamadas, faz
 * PATCH no mesmo message_id — mensagem se atualiza no lugar, sem encher
 * o canal de spam.
 *
 * Se o message_id ficar inválido (canal limpo, msg apagada manualmente),
 * a próxima chamada cai pra POST novo automaticamente.
 */
class RankingWebhook
{
    private const BRAND_COLOR = 0xFF4100;
    private const TIMEOUT_SECONDS = 5;
    private const TOP_N = 10;
    /** Chave do app_settings que guarda o message_id do Discord. */
    private const SETTING_KEY = 'discord_ranking_message_id';

    /** Tradução PT-BR dos tiers da Riot (display label). */
    private const TIER_PT = [
        'IRON'        => 'Ferro',
        'BRONZE'      => 'Bronze',
        'SILVER'      => 'Prata',
        'GOLD'        => 'Ouro',
        'PLATINUM'    => 'Platina',
        'EMERALD'     => 'Esmeralda',
        'DIAMOND'     => 'Diamante',
        'MASTER'      => 'Mestre',
        'GRANDMASTER' => 'Grão-Mestre',
        'CHALLENGER'  => 'Desafiante',
    ];

    /** Tier index pro elo score (maior = melhor). Mesma ordem do front. */
    private const TIER_ORDER = [
        'IRON'        => 0,
        'BRONZE'      => 1,
        'SILVER'      => 2,
        'GOLD'        => 3,
        'PLATINUM'    => 4,
        'EMERALD'     => 5,
        'DIAMOND'     => 6,
        'MASTER'      => 7,
        'GRANDMASTER' => 8,
        'CHALLENGER'  => 9,
    ];

    /** Division value: IV=0, III=1, II=2, I=3. Bate com front. */
    private const DIVISION_VALUE = ['IV' => 0, 'III' => 1, 'II' => 2, 'I' => 3];

    /** Tiers sem divisão (não exibem o número romano). */
    private const NO_DIVISION_TIERS = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

    public static function postOrUpdate(): bool
    {
        $url = config('services.discord.ranking_webhook');
        if (! $url) {
            return false;
        }

        $top = self::computeTopN();
        if (empty($top)) {
            return false;
        }

        $body = self::buildBody($top);

        $existingMessageId = AppSetting::get(self::SETTING_KEY);

        if ($existingMessageId) {
            // Tenta editar mensagem existente
            try {
                $res = Http::timeout(self::TIMEOUT_SECONDS)
                    ->patch("{$url}/messages/{$existingMessageId}", $body);
                if ($res->successful()) {
                    return true;
                }
                // 404 = mensagem foi apagada manualmente → cai pra criar nova
                if ($res->status() === 404) {
                    AppSetting::put(self::SETTING_KEY, null);
                } else {
                    Log::warning('RankingWebhook PATCH failed', [
                        'status' => $res->status(),
                        'body'   => $res->body(),
                    ]);
                    return false;
                }
            } catch (Throwable $e) {
                Log::warning('RankingWebhook PATCH exception', ['err' => $e->getMessage()]);
                return false;
            }
        }

        // Cria mensagem nova com ?wait=true pra receber o id de volta
        try {
            $res = Http::timeout(self::TIMEOUT_SECONDS)
                ->post("{$url}?wait=true", $body);
            if (! $res->successful()) {
                Log::warning('RankingWebhook POST failed', [
                    'status' => $res->status(),
                    'body'   => $res->body(),
                ]);
                return false;
            }
            $data = $res->json();
            if (! empty($data['id'])) {
                AppSetting::put(self::SETTING_KEY, $data['id']);
            }
            return true;
        } catch (Throwable $e) {
            Log::warning('RankingWebhook POST exception', ['err' => $e->getMessage()]);
            return false;
        }
    }

    /** Computa elo score (mesma fórmula que o front: tier*100k + div*1k + lp). */
    private static function eloScore(string $tier, ?string $division, int $lp): int
    {
        $tierUpper = strtoupper($tier);
        if (! isset(self::TIER_ORDER[$tierUpper])) return -1;
        $tierIdx = self::TIER_ORDER[$tierUpper];
        $divVal  = self::DIVISION_VALUE[strtoupper($division ?? '')] ?? 0;
        return $tierIdx * 100000 + $divVal * 1000 + $lp;
    }

    /** Top N players ordenados por elo (descendente). */
    private static function computeTopN(): array
    {
        $users = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->whereNotNull('cached_rank_tier')
            ->where('cached_rank_tier', '!=', 'Unranked')
            ->select('summoner_name', 'display_name', 'name', 'cached_rank_tier', 'cached_rank_division', 'cached_rank_lp')
            ->get();

        $ranked = [];
        foreach ($users as $u) {
            $tier = strtoupper((string) $u->cached_rank_tier);
            if (! isset(self::TIER_ORDER[$tier])) continue;
            $score = self::eloScore($tier, $u->cached_rank_division, (int) ($u->cached_rank_lp ?? 0));
            if ($score < 0) continue;
            $ranked[] = [
                'nickname' => $u->summoner_name ?: ($u->display_name ?: $u->name),
                'tier'     => $tier,
                'division' => $u->cached_rank_division,
                'lp'       => (int) ($u->cached_rank_lp ?? 0),
                'score'    => $score,
            ];
        }

        usort($ranked, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($ranked, 0, self::TOP_N);
    }

    /** Linha de cada player no embed. */
    private static function formatLine(int $position, array $r): string
    {
        $medal = match ($position) {
            1 => '🥇',
            2 => '🥈',
            3 => '🥉',
            default => '',
        };
        $tierLabel = self::TIER_PT[$r['tier']] ?? $r['tier'];
        $rankStr = in_array($r['tier'], self::NO_DIVISION_TIERS, true) || ! $r['division']
            ? "{$tierLabel} · {$r['lp']} LP"
            : "{$tierLabel} {$r['division']} · {$r['lp']} LP";

        // Top 3 com medalha + sem número (medalha já cumpre o papel);
        // 4-10 com número em mono pra alinhar visualmente.
        if ($medal !== '') {
            return "{$medal} **{$r['nickname']}** · `{$rankStr}`";
        }
        return "`" . str_pad((string) $position, 2, ' ', STR_PAD_LEFT) . ".` **{$r['nickname']}** · `{$rankStr}`";
    }

    private static function buildBody(array $top): array
    {
        $lines = [];
        foreach ($top as $i => $r) {
            $lines[] = self::formatLine($i + 1, $r);
        }
        $description = implode("\n", $lines);

        $siteBase = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        return [
            'username'   => 'Baderna Ranking',
            'avatar_url' => "{$siteBase}/logo.svg",
            'embeds'     => [[
                'title'       => '🏆 Placar de Liderança da Baderna · Top 10',
                'description' => $description,
                'color'       => self::BRAND_COLOR,
                'url'         => "{$siteBase}/ranking",
                'footer'      => ['text' => 'Atualizado a cada hora · bdrn.com.br/ranking'],
                'timestamp'   => now()->toIso8601String(),
            ]],
        ];
    }
}

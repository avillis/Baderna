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

        $lists = self::computeLists();
        if (empty($lists['baderna'])) {
            return false;
        }

        $body = self::buildBody($lists);

        $existingMessageId = AppSetting::get(self::SETTING_KEY);

        if ($existingMessageId) {
            // Tenta editar mensagem existente
            try {
                $res = Http::timeout(self::TIMEOUT_SECONDS)
                    ->patch("{$url}/messages/{$existingMessageId}", $body);
                if ($res->successful()) {
                    return true;
                }
                // 404 = mensagem foi apagada manualmente → cai pra criar nova.
                // Delete em vez de put(null) pra evitar problemas com cast 'array'.
                if ($res->status() === 404) {
                    AppSetting::where('key', self::SETTING_KEY)->delete();
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

    /**
     * Compute as duas listas:
     *  - 'baderna': todos os membros aprovados em ordem natural (user_id),
     *    bate com a aba "Baderna" do site (ranking oficial / signup order).
     *  - 'flex': mesmos membros ordenados por elo descendente (Unranked
     *    sobra no fim).
     */
    private static function computeLists(): array
    {
        $users = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->select('id', 'summoner_name', 'display_name', 'name', 'cached_rank_tier', 'cached_rank_division', 'cached_rank_lp')
            ->orderBy('id')
            ->get();

        $rows = [];
        foreach ($users as $u) {
            $tierRaw = (string) ($u->cached_rank_tier ?? '');
            $tier = strtoupper($tierRaw);
            $hasRank = $tier !== '' && $tier !== 'UNRANKED' && isset(self::TIER_ORDER[$tier]);
            $score = $hasRank
                ? self::eloScore($tier, $u->cached_rank_division, (int) ($u->cached_rank_lp ?? 0))
                : -1;
            $rows[] = [
                'nickname' => $u->summoner_name ?: ($u->display_name ?: $u->name),
                'tier'     => $hasRank ? $tier : null,
                'division' => $hasRank ? $u->cached_rank_division : null,
                'lp'       => (int) ($u->cached_rank_lp ?? 0),
                'score'    => $score,
                'hasRank'  => $hasRank,
            ];
        }

        // Baderna = ordem natural (user_id). Flex = clone ordenado por elo.
        $flex = $rows;
        usort($flex, fn ($a, $b) => $b['score'] <=> $a['score']);

        return ['baderna' => $rows, 'flex' => $flex];
    }

    /**
     * Linha de cada player no embed (PDL ao invés de LP).
     * $includeRank=false -> só nome (usado no Ranking Baderna oficial,
     * que é por posição e não tem a ver com elo do LoL).
     */
    private static function formatLine(int $position, array $r, bool $includeRank): string
    {
        $medal = match ($position) {
            1 => '🥇',
            2 => '🥈',
            3 => '🥉',
            default => '',
        };

        $rankPart = '';
        if ($includeRank) {
            if ($r['hasRank']) {
                $tierLabel = self::TIER_PT[$r['tier']] ?? $r['tier'];
                $rankStr = in_array($r['tier'], self::NO_DIVISION_TIERS, true) || ! $r['division']
                    ? "{$tierLabel} · {$r['lp']} PDL"
                    : "{$tierLabel} {$r['division']} · {$r['lp']} PDL";
                $rankPart = " · `{$rankStr}`";
            } else {
                $rankPart = " · _sem rank_";
            }
        }

        // Top 3 leva medalha (substitui o número); 4+ usa número plano.
        $prefix = $medal !== '' ? $medal : "{$position}.";

        return "{$prefix} **{$r['nickname']}**{$rankPart}";
    }

    /** Formata uma lista inteira (multi-linha). */
    private static function formatList(array $entries, bool $includeRank): string
    {
        $lines = [];
        foreach ($entries as $i => $r) {
            $lines[] = self::formatLine($i + 1, $r, $includeRank);
        }
        return implode("\n", $lines);
    }

    private static function buildBody(array $lists): array
    {
        // Baderna = só nomes (ranking por posição, não tem a ver com elo).
        // Flex = nomes + rank LoL.
        // \n\n após cada header cria linha em branco entre o título do bloco
        // e o primeiro colocado.
        $bademaBlock = "**🎖️ Ranking Baderna** _(oficial)_\n\n" . self::formatList($lists['baderna'], includeRank: false);
        $flexBlock   = "**⚔️ Ranking Flex** _(por elo)_\n\n" . self::formatList($lists['flex'], includeRank: true);

        // Linhas invisíveis (ZWS) entre os dois blocos pra criar um respiro
        // visível — Discord colapsa newlines sucessivas, mas linhas com
        // caractere zero-width permanecem visíveis. Duas linhas = gap maior.
        // No início, ZWS pra separar do título do embed.
        $description = "\u{200B}\n\n{$bademaBlock}\n\n\u{200B}\n\u{200B}\n\n{$flexBlock}";

        $siteBase = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        return [
            'username'   => 'Baderna Ranking',
            'avatar_url' => "{$siteBase}/logo.svg",
            'embeds'     => [[
                'title'       => '🏆 Placar de Liderança da Baderna',
                'description' => $description,
                'color'       => self::BRAND_COLOR,
                'url'         => "{$siteBase}/ranking",
                'footer'      => ['text' => 'Atualizado a cada hora · bdrn.com.br/ranking'],
                'timestamp'   => now()->toIso8601String(),
            ]],
        ];
    }
}

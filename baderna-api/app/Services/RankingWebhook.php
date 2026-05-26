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

    /**
     * Custom emojis do servidor da Baderna (formato Discord: <:nome:id>).
     * Nomes são case-sensitive — bate exatamente como cadastrado no servidor.
     * Esmeralda usa PLATINUM como fallback (asset ainda não subido).
     */
    private const TIER_EMOJI = [
        'IRON'        => '<:Ferro:1508925584456290404>',
        'BRONZE'      => '<:Bronze:1508925626193674314>',
        'SILVER'      => '<:Prata:1508925665658011698>',
        'GOLD'        => '<:Ouro:1508925694464229520>',
        'PLATINUM'    => '<:Platina:1508925748587663390>',
        // 'EMERALD'  → tierEmoji() cai pra PLATINUM
        'DIAMOND'     => '<:Diamante:1508925818183749642>',
        'MASTER'      => '<:Mestre:1508925858017186064>',
        'GRANDMASTER' => '<:Grao_mestre:1508925928770637976>',
        'CHALLENGER'  => '<:Desafiante:1508925959406092288>',
    ];

    /** Pega o emoji do tier; Esmeralda cai pra Platina (até o user subir o asset). */
    private static function tierEmoji(string $tier): string
    {
        if ($tier === 'EMERALD') {
            return self::TIER_EMOJI['PLATINUM'] ?? '';
        }
        return self::TIER_EMOJI[$tier] ?? '';
    }

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
     *    com ou sem Riot ID — bate com a aba "Baderna" do site (oficial).
     *  - 'flex': SÓ quem tem Riot ID conectada (summoner_name + tagLine),
     *    ordenado por elo descendente. Sem rank fica no fundo (mas só se
     *    a pessoa tiver Riot ID — sem ID nem aparece).
     */
    private static function computeLists(): array
    {
        $users = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->select('id', 'summoner_name', 'tagLine', 'display_name', 'name', 'cached_rank_tier', 'cached_rank_division', 'cached_rank_lp')
            ->orderBy('id')
            ->get();

        $rows = [];
        foreach ($users as $u) {
            $tierRaw = (string) ($u->cached_rank_tier ?? '');
            $tier = strtoupper($tierRaw);
            $hasRank = $tier !== '' && $tier !== 'UNRANKED' && isset(self::TIER_ORDER[$tier]);
            $hasRiotId = ! empty($u->summoner_name) && ! empty($u->tagLine);
            $score = $hasRank
                ? self::eloScore($tier, $u->cached_rank_division, (int) ($u->cached_rank_lp ?? 0))
                : -1;
            $rows[] = [
                'nickname'  => $u->summoner_name ?: ($u->display_name ?: $u->name),
                'tier'      => $hasRank ? $tier : null,
                'division'  => $hasRank ? $u->cached_rank_division : null,
                'lp'        => (int) ($u->cached_rank_lp ?? 0),
                'score'     => $score,
                'hasRank'   => $hasRank,
                'hasRiotId' => $hasRiotId,
            ];
        }

        // Baderna = ordem natural (user_id), TODOS os membros (com/sem Riot ID).
        // Flex = só quem tem Riot ID, ordenado por elo descendente.
        $flex = array_values(array_filter($rows, fn ($r) => $r['hasRiotId']));
        usort($flex, fn ($a, $b) => $b['score'] <=> $a['score']);

        return ['baderna' => $rows, 'flex' => $flex];
    }

    /** Prefixo de posição: medalha pro top 3, número pro resto. */
    private static function positionPrefix(int $position): string
    {
        return match ($position) {
            1 => '🥇',
            2 => '🥈',
            3 => '🥉',
            default => "{$position}.",
        };
    }

    /** Linha do "nome" — vai na coluna esquerda (Jogadores). */
    private static function formatNameLine(int $position, array $r): string
    {
        return self::positionPrefix($position) . " **{$r['nickname']}**";
    }

    /** Linha do "rank" — vai na coluna direita (Ranque). */
    private static function formatRankLine(array $r): string
    {
        // Sem rank → zero-width space pra ocupar a linha (alinha com a
        // linha do Jogadores) mas não mostra nada visível.
        if (! $r['hasRank']) return "\u{200B}";

        $tierLabel = self::TIER_PT[$r['tier']] ?? $r['tier'];
        $rankStr = in_array($r['tier'], self::NO_DIVISION_TIERS, true) || ! $r['division']
            ? "{$tierLabel} · {$r['lp']} PDL"
            : "{$tierLabel} {$r['division']} · {$r['lp']} PDL";

        $emoji = self::tierEmoji($r['tier']);
        $emojiConfigured = $emoji !== '' && ! str_contains($emoji, ':0>');

        return $emojiConfigured
            ? "{$emoji} {$rankStr}"
            : "`{$rankStr}`";
    }

    /** Lista single-column de nomes (Ranking Baderna). */
    private static function formatBadernaList(array $entries): string
    {
        $lines = [];
        foreach ($entries as $i => $r) {
            $lines[] = self::formatNameLine($i + 1, $r);
        }
        return implode("\n", $lines);
    }

    /** Constrói as duas colunas (Jogadores / Ranque) do Ranking Flex. */
    private static function buildFlexColumns(array $entries): array
    {
        $names = [];
        $ranks = [];
        foreach ($entries as $i => $r) {
            $names[] = self::formatNameLine($i + 1, $r);
            $ranks[] = self::formatRankLine($r);
        }
        return [
            'names' => implode("\n", $names),
            'ranks' => implode("\n", $ranks),
        ];
    }

    private static function buildBody(array $lists): array
    {
        // Baderna = só nomes (ranking por posição, não tem a ver com elo do LoL).
        // Fica no description em coluna única.
        $bademaBlock = "**🎖️ Ranking Baderna** _(oficial)_\n\n" . self::formatBadernaList($lists['baderna']);

        // Flex vai em DOIS FIELDS inline (nome | rank) pra criar layout de
        // duas colunas alinhadas, igual a ref do user. O header "⚔️ Ranking
        // Flex" fica no final do description pra cair logo antes dos fields.
        $flexCols = self::buildFlexColumns($lists['flex']);

        $description = "\u{200B}\n\n{$bademaBlock}\n\n\u{200B}\n\u{200B}\n\n**⚔️ Ranking Flex** _(por elo)_";

        $fields = [
            [
                'name'   => 'Jogadores',
                'value'  => $flexCols['names'],
                'inline' => true,
            ],
            [
                'name'   => 'Ranque',
                'value'  => $flexCols['ranks'],
                'inline' => true,
            ],
        ];

        $siteBase = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        return [
            'username'   => 'Baderna Ranking',
            'avatar_url' => "{$siteBase}/logo.svg",
            'embeds'     => [[
                'title'       => '🏆 Placar de Liderança da Baderna',
                'description' => $description,
                'color'       => self::BRAND_COLOR,
                'url'         => "{$siteBase}/ranking",
                'fields'      => $fields,
                'footer'      => ['text' => 'Atualizado a cada hora · bdrn.com.br/ranking'],
                'timestamp'   => now()->toIso8601String(),
            ]],
        ];
    }
}

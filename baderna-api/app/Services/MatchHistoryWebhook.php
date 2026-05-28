<?php

namespace App\Services;

use App\Models\Inhouse;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Posta um resumo permanente de cada partida encerrada no canal de histórico
 * do Discord via webhook. Diferente das notificações do #inhouse (que ficam
 * no canal de lobby), esse canal serve como log imutável de resultados.
 *
 * Uma mensagem por partida, nunca editada.
 */
class MatchHistoryWebhook
{
    private const BRAND_COLOR     = 0xFF4100;
    private const TIMEOUT_SECONDS = 5;

    private const BLUE_EMOJI   = '<:blue_side:1509344440735502406>';
    private const RED_EMOJI    = '<:red_side:1509344424965046302>';
    private const TROPHY_EMOJI = '<:Reward_icon:1509346254096826368>';
    private const COIN_PLUS    = '<:Coin_icon_plus:1509296400666460433>';
    private const COIN_DEFAULT = '<:Coin_default:1509348466432937984>';
    private const CODE_EMOJI   = '<:Mission_icon:1509345989696163991>';

    public static function post(
        Inhouse $inhouse,
        string $winnerSide,
        int $winAmount,
        int $lossAmount,
    ): void {
        $webhookUrl = config('services.discord.history_webhook');
        if (! $webhookUrl) return;

        $payload = is_array($inhouse->payload) ? $inhouse->payload : [];
        $players = is_array($payload['players'] ?? null) ? $payload['players'] : [];

        // Resolve nicknames canônicos do banco (igual ao DiscordWebhook).
        $playerById = [];
        foreach ($players as $p) {
            if (is_array($p) && isset($p['id'])) $playerById[$p['id']] = $p;
        }
        $slugToNickname = [];
        $slugToTeamName = [];
        if (! empty($playerById)) {
            $users = User::select('id', 'summoner_name', 'display_name', 'name', 'team_name')->get();
            foreach ($users as $u) {
                $slug = Str::slug((string) ($u->summoner_name ?? ''));
                if ($slug !== '' && isset($playerById[$slug])) {
                    $slugToNickname[$slug] = $u->summoner_name ?: ($u->display_name ?: $u->name);
                    if (! empty($u->team_name)) $slugToTeamName[$slug] = $u->team_name;
                }
            }
        }

        $resolveNick = fn (array $p): string =>
            $slugToNickname[$p['id'] ?? ''] ?? ($p['nickname'] ?? '?');

        $resolveTeamName = function (?array $leader) use ($slugToTeamName, $resolveNick): ?string {
            if (! $leader) return null;
            $id = $leader['id'] ?? null;
            return $id ? ($slugToTeamName[$id] ?? null) : null;
        };

        $blueLeader = $playerById[$payload['blueLeaderId'] ?? ''] ?? null;
        $redLeader  = $playerById[$payload['redLeaderId'] ?? ''] ?? null;

        $teamLabel = function (?array $leader, string $default) use ($resolveNick, $resolveTeamName): string {
            $nick   = $leader ? $resolveNick($leader) : null;
            $custom = $resolveTeamName($leader);
            return $custom ?: ($nick ? "Time {$nick}" : "Time {$default}");
        };

        $blueName = $teamLabel($blueLeader, 'Azul');
        $redName  = $teamLabel($redLeader, 'Vermelho');

        // Separa jogadores por time e monta listas de nicks.
        $bluePlayers = array_values(array_filter($players, fn ($p) => ($p['side'] ?? null) === 'blue'));
        $redPlayers  = array_values(array_filter($players, fn ($p) => ($p['side'] ?? null) === 'red'));

        $playerList = function (array $teamPlayers) use ($resolveNick): string {
            $names = array_map(fn ($p) => $resolveNick($p), $teamPlayers);
            return empty($names) ? '_–_' : implode(' · ', $names);
        };

        $isBlueWin   = $winnerSide === 'blue';
        $winnerEmoji = $isBlueWin ? self::BLUE_EMOJI : self::RED_EMOJI;
        $loserEmoji  = $isBlueWin ? self::RED_EMOJI  : self::BLUE_EMOJI;
        $winnerName  = $isBlueWin ? $blueName : $redName;
        $loserName   = $isBlueWin ? $redName  : $blueName;
        $winnerList  = $isBlueWin ? $playerList($bluePlayers) : $playerList($redPlayers);
        $loserList   = $isBlueWin ? $playerList($redPlayers)  : $playerList($bluePlayers);

        $modeLabel = ($payload['mode'] ?? 'random') === 'leader' ? 'Líder' : 'Aleatório';
        $siteBase  = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        $description =
            self::TROPHY_EMOJI . " **{$winnerName}** venceu!\n\n"
            . "{$winnerEmoji} **{$winnerName}**\n{$winnerList}\n\n"
            . "{$loserEmoji} _{$loserName}_\n{$loserList}\n\n"
            . self::COIN_PLUS    . " +{$winAmount} moedas · time vencedor\n"
            . self::COIN_DEFAULT . " +{$lossAmount} moedas · time perdedor";

        $body = [
            'embeds' => [[
                'title'       => self::TROPHY_EMOJI . ' Resultado · ' . $inhouse->short_code,
                'description' => $description,
                'url'         => "{$siteBase}/inhouse/{$inhouse->short_code}",
                'color'       => self::BRAND_COLOR,
                'fields'      => [
                    [
                        'name'   => self::CODE_EMOJI . ' Código',
                        'value'  => "`{$inhouse->short_code}`",
                        'inline' => true,
                    ],
                    [
                        'name'   => '⚙️ Modo',
                        'value'  => $modeLabel,
                        'inline' => true,
                    ],
                ],
                'footer'    => ['text' => 'bdrn.com.br/inhouse/' . $inhouse->short_code],
                'timestamp' => now()->toIso8601String(),
            ]],
        ];

        try {
            Http::timeout(self::TIMEOUT_SECONDS)->post($webhookUrl, $body);
        } catch (Throwable $e) {
            Log::warning('MatchHistoryWebhook::post failed', [
                'error'      => $e->getMessage(),
                'inhouse_id' => $inhouse->id,
            ]);
        }
    }
}

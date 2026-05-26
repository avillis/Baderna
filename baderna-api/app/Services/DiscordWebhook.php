<?php

namespace App\Services;

use App\Models\Inhouse;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Disparos pro Discord via webhooks. Sem dependência externa — usa o cliente
 * HTTP do Laravel direto. Toda chamada é defensiva: catch genérico só pra
 * logar, NUNCA derruba o caller (ex.: criação de Inhouse) se o webhook
 * falhar.
 */
class DiscordWebhook
{
    /** Cor da marca Baderna usada na barra lateral do embed. */
    private const BRAND_COLOR = 0xFF4100;

    /** Timeout curto pra não pendurar a request HTTP do usuário. */
    private const TIMEOUT_SECONDS = 5;

    /**
     * Manda mensagem no #inhouse anunciando lobby novo.
     * Lê a URL do webhook de `services.discord.inhouse_webhook` (que vem do
     * .env via DISCORD_INHOUSE_WEBHOOK_URL). Se não estiver configurada,
     * faz no-op silencioso — útil pra ambientes de dev/teste.
     */
    public static function notifyInhouseCreated(Inhouse $inhouse, ?User $creator): void
    {
        $url = config('services.discord.inhouse_webhook');
        if (! $url) {
            return;
        }

        $payload    = is_array($inhouse->payload) ? $inhouse->payload : [];
        $players    = is_array($payload['players'] ?? null) ? $payload['players'] : [];
        $playerCount = count($players);
        $isLeaderMode = ($payload['mode'] ?? null) === 'leader';
        $modeLabel  = $isLeaderMode ? 'Líder' : 'Aleatório';

        // Mapa player.id → player do payload (lookup O(1) pelos leaders).
        $playerById = [];
        foreach ($players as $p) {
            if (is_array($p) && isset($p['id'])) {
                $playerById[$p['id']] = $p;
            }
        }

        // Resolve dados CANÔNICOS do banco pelos players do payload:
        //  - nickname (summoner_name): preserva nome completo / atualizado
        //  - team_name (custom): nome de time setado pelo user na Minha Conta
        // Match por Str::slug(summoner_name) === player.id.
        $allSlugs = array_keys($playerById);
        $slugToNickname = [];
        $slugToTeamName = [];
        if (! empty($allSlugs)) {
            $users = User::select('id', 'summoner_name', 'display_name', 'name', 'team_name')->get();
            foreach ($users as $u) {
                $slug = Str::slug((string) ($u->summoner_name ?? ''));
                if ($slug !== '' && in_array($slug, $allSlugs, true)) {
                    $slugToNickname[$slug] = $u->summoner_name
                        ?: ($u->display_name ?: $u->name);
                    if (! empty($u->team_name)) {
                        $slugToTeamName[$slug] = $u->team_name;
                    }
                }
            }
        }

        // Substitui o nickname de cada player pelo canonical (se achou no banco).
        $resolveNick = function (array $p) use ($slugToNickname): string {
            $id = $p['id'] ?? null;
            return $slugToNickname[$id] ?? ($p['nickname'] ?? '?');
        };
        // Custom team_name do líder se ele setou na conta; senão null.
        $resolveTeamName = function (?array $leader) use ($slugToTeamName): ?string {
            if (! $leader) return null;
            $id = $leader['id'] ?? null;
            return $id ? ($slugToTeamName[$id] ?? null) : null;
        };

        $blueLeader = $playerById[$payload['blueLeaderId'] ?? ''] ?? null;
        $redLeader  = $playerById[$payload['redLeaderId'] ?? ''] ?? null;

        // Separa players por time + ordena líder primeiro (consistente com o card do site)
        $bluePlayers = [];
        $redPlayers  = [];
        foreach ($players as $p) {
            if (! is_array($p)) continue;
            $side = $p['side'] ?? null;
            if ($side === 'blue') $bluePlayers[] = $p;
            elseif ($side === 'red') $redPlayers[] = $p;
        }

        $creatorName = $creator
            ? ($creator->display_name ?: ($creator->summoner_name ?: $creator->name))
            : 'Alguém';
        $creatorAvatar = $creator?->avatar_src;

        $siteBase  = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');
        $inhouseUrl = "{$siteBase}/inhouse/{$inhouse->short_code}";

        // Monta o bloco de cada time em Markdown — convenção do site:
        //  1. Se o líder configurou um team_name custom na Minha Conta → usa ele.
        //  2. Senão: "Time {leaderNickname}" (leader-mode) ou
        //     "Time Azul/Vermelho" (random/sem líder).
        $teamBlock = function (
            string $colorEmoji,
            string $defaultLabel,
            ?array $leader,
            array $teamPlayers,
        ) use ($resolveNick, $resolveTeamName): string {
            $leaderNick = $leader ? $resolveNick($leader) : null;
            $customName = $resolveTeamName($leader);
            $name = $customName
                ?: ($leaderNick ? "Time {$leaderNick}" : "Time {$defaultLabel}");
            // Lista os membros que NÃO são o líder (o líder já tá destacado)
            $others = array_values(array_filter(
                $teamPlayers,
                fn ($p) => ! $leader || ($p['id'] ?? null) !== ($leader['id'] ?? null),
            ));
            $names = array_map(fn ($p) => $resolveNick($p), $others);
            $memberLine = empty($names) ? '_(sem membros)_' : implode(' · ', $names);
            $leaderLine = $leaderNick
                ? "Líder · **{$leaderNick}**\n"
                : '';
            // Linha em branco entre o nome do time e a linha do líder pra dar
            // respiro (Discord renderiza '\n\n' como parágrafo separado).
            return "{$colorEmoji} **{$name}**\n\n{$leaderLine}{$memberLine}";
        };

        $blueBlock = $teamBlock('🔵', 'Azul', $blueLeader, $bluePlayers);
        $redBlock  = $teamBlock('🔴', 'Vermelho', $redLeader, $redPlayers);
        $description = "{$blueBlock}\n\n⚔️ **vs** ⚔️\n\n{$redBlock}";

        // Fields embaixo do bloco vs (compactos, na horizontal): código + modo + total.
        $fields = [
            [
                'name'   => '🔑 Código',
                'value'  => "`{$inhouse->short_code}`",
                'inline' => true,
            ],
            [
                'name'   => '⚔️ Modo',
                'value'  => $modeLabel,
                'inline' => true,
            ],
            [
                'name'   => '👥 Jogadores',
                'value'  => "{$playerCount}/10",
                'inline' => true,
            ],
        ];

        $body = [
            'username'   => 'Baderna Inhouse',
            // Logo da Baderna como avatar do webhook (sobrescreve a config no Discord).
            'avatar_url' => "{$siteBase}/logo.svg",
            'content'    => "@here — **{$creatorName}** abriu um inhouse! 🎮",
            'allowed_mentions' => ['parse' => ['everyone']],
            'embeds'     => [[
                'title'       => '🎮 Novo Inhouse criado!',
                'description' => $description,
                'url'         => $inhouseUrl,
                'color'       => self::BRAND_COLOR,
                'author'      => array_filter([
                    'name'     => $creatorName,
                    'icon_url' => $creatorAvatar,
                ]),
                'fields' => $fields,
                'footer' => [
                    'text' => 'bdrn.com.br · clique no título pra entrar no lobby',
                ],
                'timestamp' => $inhouse->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ]],
        ];

        try {
            Http::timeout(self::TIMEOUT_SECONDS)->post($url, $body);
        } catch (Throwable $e) {
            // Não rebaixa o erro — só registra. Inhouse já foi criado e
            // não deve falhar a request HTTP do user só porque o Discord
            // está fora ou o webhook foi removido.
            Log::warning('DiscordWebhook::notifyInhouseCreated failed', [
                'error' => $e->getMessage(),
                'inhouse_id' => $inhouse->id,
            ]);
        }
    }
}

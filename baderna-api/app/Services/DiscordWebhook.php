<?php

namespace App\Services;

use App\Models\Inhouse;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
        $players    = $payload['players'] ?? [];
        $playerCount = is_array($players) ? count($players) : 0;
        $modeLabel  = ($payload['mode'] ?? null) === 'leader'
            ? 'Líderes escolhem'
            : 'Aleatório';

        // Resolve líderes — players têm id + nickname + side; os leaderIds
        // referenciam o player.id. Faz um mapinha p/ lookup O(1).
        $playerById = [];
        if (is_array($players)) {
            foreach ($players as $p) {
                if (is_array($p) && isset($p['id'])) {
                    $playerById[$p['id']] = $p;
                }
            }
        }
        $blueLeader = $playerById[$payload['blueLeaderId'] ?? ''] ?? null;
        $redLeader  = $playerById[$payload['redLeaderId'] ?? ''] ?? null;

        $creatorName = $creator
            ? ($creator->display_name ?: ($creator->summoner_name ?: $creator->name))
            : 'Alguém';
        $creatorAvatar = $creator?->avatar_src;

        $siteBase  = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');
        $inhouseUrl = "{$siteBase}/inhouse/{$inhouse->short_code}";

        // Fields base (sempre presentes)
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
                'value'  => (string) $playerCount,
                'inline' => true,
            ],
        ];

        // Líderes — só aparece quando rolou pick de líder na criação.
        // Discord renderiza 3 fields inline por linha, então essas 2 ficam
        // na linha de baixo com um padding "invisível" no final pra alinhar.
        if ($blueLeader || $redLeader) {
            if ($blueLeader) {
                $fields[] = [
                    'name'   => '🔵 Líder Azul',
                    'value'  => '**' . ($blueLeader['nickname'] ?? '?') . '**',
                    'inline' => true,
                ];
            }
            if ($redLeader) {
                $fields[] = [
                    'name'   => '🔴 Líder Vermelho',
                    'value'  => '**' . ($redLeader['nickname'] ?? '?') . '**',
                    'inline' => true,
                ];
            }
            // Espaço invisível na 3ª coluna pra alinhar a linha de líderes
            // com a linha de cima (zero-width space dentro de uma field).
            $fields[] = [
                'name'   => "\u{200B}",
                'value'  => "\u{200B}",
                'inline' => true,
            ];
        }

        $body = [
            'username'   => 'Baderna Inhouse',
            // Logo da Baderna como avatar do webhook (sobrescreve a config no Discord).
            'avatar_url' => "{$siteBase}/logo.svg",
            'content'    => "@here — **{$creatorName}** abriu um inhouse! 🎮",
            'allowed_mentions' => ['parse' => ['everyone']],
            'embeds'     => [[
                'title'       => '🎮 Novo Inhouse criado!',
                'description' => "Bora pra Rift! Clica no link pra entrar no lobby.",
                'url'         => $inhouseUrl,
                'color'       => self::BRAND_COLOR,
                'author'      => array_filter([
                    'name'     => $creatorName,
                    'icon_url' => $creatorAvatar,
                ]),
                'fields' => $fields,
                'footer' => [
                    'text' => 'bdrn.com.br',
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

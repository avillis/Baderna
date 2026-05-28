<?php

namespace App\Services;

use App\Models\AppSetting;
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
     *
     * $kind:
     *   - 'created' → "🎮 Novo Inhouse criado!" (mostra membros só se
     *     o time já tá completo; caso contrário só líderes + código + modo)
     *   - 'ready'   → "⚔️ Times prontos!" (sempre com membros completos —
     *     usado quando o leader-mode termina o draft)
     */
    public static function notifyInhouseCreated(Inhouse $inhouse, ?User $creator, string $kind = 'created'): void
    {
        $token     = config('services.discord.bot_token');
        $channelId = config('services.discord.inhouse_channel_id');
        if (! $token || ! $channelId) {
            return;
        }

        $isReady = $kind === 'ready';
        $title = $isReady ? '<:Versus:1509343594476208168> Times prontos!' : '<:Summoners_Rift_icon:1509343682883747980> Novo Inhouse criado!';
        // Mostra membros sempre que 'ready', ou no 'created' quando o time já
        // foi totalmente montado (random mode = completo desde a criação).
        $includeMembers = $isReady || $inhouse->isComplete();

        $payload    = is_array($inhouse->payload) ? $inhouse->payload : [];
        $players    = is_array($payload['players'] ?? null) ? $payload['players'] : [];
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
        ) use ($resolveNick, $resolveTeamName, $includeMembers): string {
            $leaderNick = $leader ? $resolveNick($leader) : null;
            $customName = $resolveTeamName($leader);
            $name = $customName
                ?: ($leaderNick ? "Time {$leaderNick}" : "Time {$defaultLabel}");
            $leaderLine = $leaderNick ? "Líder · **{$leaderNick}**" : '';

            // Na primeira mensagem (sem membros), só nome do time + líder +
            // indicador visível de "draft pendente" embaixo de cada time.
            if (! $includeMembers) {
                return "{$colorEmoji} **{$name}**\n\n{$leaderLine}\n_Aguardando draft..._";
            }

            // Versão completa: + lista dos membros (excluindo o líder, que
            // já tá destacado na linha de cima). Linha em branco entre o
            // líder e a lista pra não ficar grudado.
            $others = array_values(array_filter(
                $teamPlayers,
                fn ($p) => ! $leader || ($p['id'] ?? null) !== ($leader['id'] ?? null),
            ));
            $names = array_map(fn ($p) => $resolveNick($p), $others);
            $memberLine = empty($names) ? '_(sem membros)_' : implode(' · ', $names);
            return "{$colorEmoji} **{$name}**\n\n{$leaderLine}\n\n{$memberLine}";
        };

        $blueBlock = $teamBlock('<:blue_side:1509344440735502406>', 'Azul', $blueLeader, $bluePlayers);
        $redBlock  = $teamBlock('<:red_side:1509344424965046302>', 'Vermelho', $redLeader, $redPlayers);
        $description = "{$blueBlock}\n\n<:Versus:1509343594476208168> **vs** <:Versus:1509343594476208168>\n\n{$redBlock}";

        // Se ainda falta drafting, deixa claro no topo da descrição.
        if (! $includeMembers) {
            $description = "_Aguardando os líderes draftarem os times..._\n\n{$description}";
        }

        // Fields embaixo do bloco vs (compactos, na horizontal): código + modo.
        // Spacer com zero-width-space na frente cria respiro entre o final
        // da description (Líder · X / lista de membros) e a fileira de fields —
        // Discord renderiza fields colados na description sem isso.
        // Removido o campo "Jogadores" — inhouse é sempre 5v5, info redundante.
        $fields = [
            [
                'name'   => "\u{200B}",
                'value'  => "\u{200B}",
                'inline' => false,
            ],
            [
                'name'   => '<:Mission_icon:1509345989696163991> Código',
                'value'  => "`{$inhouse->short_code}`",
                'inline' => true,
            ],
            [
                'name'   => '<:Versus:1509343594476208168> Modo',
                'value'  => $modeLabel,
                'inline' => true,
            ],
        ];

        // Texto curto fora do embed muda conforme o estágio.
        $contentText = $isReady
            ? "<:Versus:1509343594476208168> **Times prontos no inhouse!**"
            : "@here — **{$creatorName}** abriu um inhouse! <:Summoners_Rift_icon:1509343682883747980>";

        $body = [
            'content'          => $contentText,
            'allowed_mentions' => ['parse' => ['everyone']],
            'embeds'     => [[
                'title'       => $title,
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
            Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->post("https://discord.com/api/v10/channels/{$channelId}/messages", $body);
        } catch (Throwable $e) {
            Log::warning('DiscordWebhook::notifyInhouseCreated failed', [
                'error' => $e->getMessage(),
                'inhouse_id' => $inhouse->id,
            ]);
        }

        // Renomeia canais de voz Azul/Vermelho com o nome dos times só
        // quando os times tão completos (random na criação OU leader
        // depois do draft fechar). maybeNotifyDiscord já garante que
        // isso roda só uma vez por inhouse (via flag no payload).
        if ($includeMembers) {
            $blueTeamName = $resolveTeamName($blueLeader)
                ?: ($blueLeader ? "Time {$resolveNick($blueLeader)}" : 'Azul');
            $redTeamName = $resolveTeamName($redLeader)
                ?: ($redLeader ? "Time {$resolveNick($redLeader)}" : 'Vermelho');
            self::renameInhouseChannels($blueTeamName, $redTeamName);
        }
    }

    /**
     * Manda anúncio no #inhouse quando o vencedor é definido. Mesmo padrão
     * de notifyInhouseCreated — defensivo, log-only em erro.
     *
     * $winnerSide: 'blue' | 'red'
     * $winAmount/$lossAmount: moedas creditadas (pra mostrar no embed)
     */
    public static function notifyInhouseWinner(
        Inhouse $inhouse,
        string $winnerSide,
        int $winAmount,
        int $lossAmount,
    ): void {
        $token     = config('services.discord.bot_token');
        $channelId = config('services.discord.inhouse_channel_id');
        if (! $token || ! $channelId) {
            return;
        }

        $payload  = is_array($inhouse->payload) ? $inhouse->payload : [];
        $players  = is_array($payload['players'] ?? null) ? $payload['players'] : [];

        $playerById = [];
        foreach ($players as $p) {
            if (is_array($p) && isset($p['id'])) {
                $playerById[$p['id']] = $p;
            }
        }
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
        $resolveNick = function (array $p) use ($slugToNickname): string {
            $id = $p['id'] ?? null;
            return $slugToNickname[$id] ?? ($p['nickname'] ?? '?');
        };
        $resolveTeamName = function (?array $leader) use ($slugToTeamName): ?string {
            if (! $leader) return null;
            $id = $leader['id'] ?? null;
            return $id ? ($slugToTeamName[$id] ?? null) : null;
        };

        $blueLeader = $playerById[$payload['blueLeaderId'] ?? ''] ?? null;
        $redLeader  = $playerById[$payload['redLeaderId'] ?? ''] ?? null;

        $teamLabel = function (?array $leader, string $defaultLabel) use ($resolveNick, $resolveTeamName): string {
            $leaderNick = $leader ? $resolveNick($leader) : null;
            $customName = $resolveTeamName($leader);
            return $customName
                ?: ($leaderNick ? "Time {$leaderNick}" : "Time {$defaultLabel}");
        };
        $blueName = $teamLabel($blueLeader, 'Azul');
        $redName  = $teamLabel($redLeader, 'Vermelho');

        $isBlueWin = $winnerSide === 'blue';
        $winnerName = $isBlueWin ? $blueName : $redName;
        $loserName  = $isBlueWin ? $redName : $blueName;
        $winnerEmoji = $isBlueWin ? '<:blue_side:1509344440735502406>' : '<:red_side:1509344424965046302>';
        $loserEmoji  = $isBlueWin ? '<:red_side:1509344424965046302>' : '<:blue_side:1509344440735502406>';

        $siteBase  = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');
        $inhouseUrl = "{$siteBase}/inhouse/{$inhouse->short_code}";

        $description =
            "{$winnerEmoji} **{$winnerName}** venceu!\n\n"
            . "{$loserEmoji} _{$loserName}_\n\n"
            . "<:Coin_icon_plus:1509296400666460433> +{$winAmount} moedas pro time vencedor\n\n"
            . "<:Coin_default:1509348466432937984> +{$lossAmount} moedas pro time perdedor";

        $body = [
            'content' => "<:Reward_icon:1509346254096826368> **Resultado do inhouse!**",
            'embeds'  => [[
                'title'       => '<:Reward_icon:1509346254096826368> Vencedor definido!',
                'description' => $description,
                'url'         => $inhouseUrl,
                'color'       => self::BRAND_COLOR,
                'fields' => [
                    [
                        'name'   => "\u{200B}",
                        'value'  => "\u{200B}",
                        'inline' => false,
                    ],
                    [
                        'name'   => '<:Mission_icon:1509345989696163991> Código',
                        'value'  => "`{$inhouse->short_code}`",
                        'inline' => true,
                    ],
                ],
                'footer' => [
                    'text' => 'bdrn.com.br · clique no título pra ver o lobby',
                ],
                'timestamp' => now()->toIso8601String(),
            ]],
        ];

        try {
            Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->post("https://discord.com/api/v10/channels/{$channelId}/messages", $body);
        } catch (Throwable $e) {
            Log::warning('DiscordWebhook::notifyInhouseWinner failed', [
                'error' => $e->getMessage(),
                'inhouse_id' => $inhouse->id,
            ]);
        }

        self::renameInhouseChannels('Azul', 'Vermelho');
    }

    /**
     * Renomeia os canais de voz do inhouse via Discord REST API. Usa o
     * bot token (com permissão MANAGE_CHANNELS) — não dá pra fazer via
     * webhook. No-op se faltar config. Discord rate-limita rename em
     * ~2/10min por canal — se passar disso, retorna 429 e o catch só
     * loga sem propagar.
     */
    public static function renameInhouseChannels(string $blueTeamName, string $redTeamName): void
    {
        $token  = config('services.discord.bot_token');
        $blueId = config('services.discord.blue_channel_id');
        $redId  = config('services.discord.red_channel_id');
        if (! $token || ! $blueId || ! $redId) return;

        self::patchChannelName((string) $token, (string) $blueId, "🔵 - {$blueTeamName} - 🔵");
        self::patchChannelName((string) $token, (string) $redId,  "🔴 - {$redTeamName} - 🔴");
    }

    /**
     * Posta (ou edita in-place) as regras da Baderna no canal #regras do
     * Discord via bot token. Guarda o message_id em app_settings pra não
     * criar uma nova mensagem a cada sync — se a mensagem for apagada
     * manualmente no Discord, na próxima chamada cria uma nova.
     */
    /**
     * Posta (ou edita in-place) as regras da Baderna no canal #regras via
     * webhook. Mesma estratégia do RankingWebhook: ?wait=true no POST pra
     * capturar o message_id, PATCH para edições seguintes, fallback pra POST
     * novo se a mensagem tiver sido apagada manualmente.
     */
    public static function syncRulesToChannel(): bool
    {
        $url = config('services.discord.rules_webhook');
        if (! $url) return false;

        $body       = self::buildRulesBody();
        $settingKey = 'discord_rules_message_id';
        $existingId = AppSetting::get($settingKey);

        if ($existingId) {
            try {
                $res = Http::timeout(self::TIMEOUT_SECONDS)
                    ->patch("{$url}/messages/{$existingId}", $body);
                if ($res->successful()) return true;
                if ($res->status() === 404) {
                    AppSetting::where('key', $settingKey)->delete();
                } else {
                    Log::warning('DiscordWebhook::syncRules PATCH failed', [
                        'status' => $res->status(), 'body' => $res->body(),
                    ]);
                    return false;
                }
            } catch (Throwable $e) {
                Log::warning('DiscordWebhook::syncRules PATCH exception', ['err' => $e->getMessage()]);
                return false;
            }
        }

        try {
            $res = Http::timeout(self::TIMEOUT_SECONDS)
                ->post("{$url}?wait=true", $body);
            if (! $res->successful()) {
                Log::warning('DiscordWebhook::syncRules POST failed', [
                    'status' => $res->status(), 'body' => $res->body(),
                ]);
                return false;
            }
            $data = $res->json();
            if (! empty($data['id'])) {
                AppSetting::put($settingKey, $data['id']);
            }
            return true;
        } catch (Throwable $e) {
            Log::warning('DiscordWebhook::syncRules POST exception', ['err' => $e->getMessage()]);
            return false;
        }
    }

    /** Monta o payload do embed de regras, idêntico ao estilo do ranking. */
    private static function buildRulesBody(): array
    {
        $rules = [
            ['n' => '01', 's' => 'A Bíblia',       'f' => 'Não faça nada que não esteja na Bíblia.'],
            ['n' => '02', 's' => 'Borboyote',       'f' => 'Seja um inimigo declarado da Borboyote.'],
            ['n' => '03', 's' => 'O Sales',         'f' => 'Trate o Sales como se ele fosse uma pessoa normal.'],
            ['n' => '04', 's' => 'Flex alheia',     'f' => 'É terminantemente proibido intar a flex alheia.'],
            ['n' => '05', 's' => 'Respeito',        'f' => 'Respeite as mulheres e as crianças.'],
            ['n' => '06', 's' => 'Laicidade',       'f' => 'O grupo é laico.'],
            ['n' => '07', 's' => 'João',            'f' => 'Fvck João.'],
            ['n' => '08', 's' => 'Wilson & álcool', 'f' => 'Mantenha bebidas alcoólicas longe do Wilson.'],
            ['n' => '09', 's' => 'Muros',           'f' => 'É proibido pular muros.'],
            ['n' => '10', 's' => 'ADMs',            'f' => 'Respeite os ADMs.'],
            ['n' => '11', 's' => 'Wilson',          'f' => 'Jamais ajude o Wilson.'],
            ['n' => '12', 's' => 'Fotos',           'f' => 'Proibido mandar foto de MERDA (sujeito a banimento instantâneo).'],
            ['n' => '13', 's' => 'Lema',            'f' => 'O nosso lema é: ousadia e alegria.'],
            ['n' => '15', 's' => 'Amigas da Alice', 'f' => 'Mantenha as amigas da Alice longe do João.'],
            ['n' => '16', 's' => 'Decência',        'f' => 'Seja uma pessoa decente, por favor.'],
            ['n' => '17', 's' => 'Alex G. & Rml',  'f' => 'Fvck Alex G. Fvck Rml.'],
            ['n' => '18', 's' => 'Para né',         'f' => 'Aaah meu, para, né?!'],
            ['n' => '19', 's' => 'Ditadura',        'f' => 'Grupo controlado pela Ditadura Socialista do STF e do PT.'],
            ['n' => '20', 's' => 'Picantes',        'f' => 'Perguntinhas picantes permitidas somente após as 21h.'],
            ['n' => '21', 's' => 'Call',            'f' => 'Não bater punheta em call ou adjacências.'],
        ];

        $lines = array_map(
            fn($r) => "**{$r['n']}.** {$r['f']}",
            $rules
        );
        $description = implode("\n", $lines);

        $siteBase = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        return [
            'embeds' => [[
                'title'       => '📋 Regras da Baderna',
                'description' => $description,
                'color'       => self::BRAND_COLOR,
                'url'         => "{$siteBase}/regras",
                'footer'      => ['text' => 'bdrn.com.br/regras · última sync'],
                'timestamp'   => now()->toIso8601String(),
            ]],
        ];
    }

    private static function patchChannelName(string $token, string $channelId, string $name): void
    {
        try {
            Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->patch("https://discord.com/api/v10/channels/{$channelId}", [
                    'name' => $name,
                ]);
        } catch (Throwable $e) {
            Log::warning('DiscordWebhook::patchChannelName failed', [
                'error' => $e->getMessage(),
                'channel' => $channelId,
            ]);
        }
    }
}

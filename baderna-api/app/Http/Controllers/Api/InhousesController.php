<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Inhouse;
use App\Models\MemberCoin;
use App\Models\User;
use App\Services\DiscordWebhook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InhousesController extends Controller
{
    public function index()
    {
        return response()->json(
            Inhouse::orderByDesc('created_at')
                ->get()
                ->map(fn ($i) => $this->serialize($i))
        );
    }

    public function show(string $shortCode)
    {
        $inhouse = Inhouse::where('short_code', $shortCode)->first();
        if (!$inhouse) return response()->json(['error' => 'Não encontrada.'], 404);
        return response()->json($this->serialize($inhouse));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'payload' => 'required|array',
            'payload.players' => 'required|array|min:1',
            'payload.blueLeaderId' => 'nullable|string',
            'payload.redLeaderId' => 'nullable|string',
            'payload.mode' => 'required|string|in:random,leader',
        ]);

        $shortCode = $this->generateShortCode();
        $inhouse = Inhouse::create([
            'short_code' => $shortCode,
            'payload' => $data['payload'],
            'created_by_user_id' => $request->user()->id,
        ]);

        // Random mode: todos já vêm com side blue/red → completo na criação.
        // Leader mode: a maioria começa com side='pool' (espera o draft) →
        // a notificação rola depois no update(), quando o time fica completo.
        $this->maybeNotifyDiscord($inhouse, $request->user());

        return response()->json($this->serialize($inhouse), 201);
    }

    /**
     * Atualiza um inhouse existente (drag-drop de jogadores, mode, líderes).
     * Aceita merge parcial do payload — só campos enviados sobrescrevem.
     */
    public function update(Request $request, string $shortCode)
    {
        $inhouse = Inhouse::where('short_code', $shortCode)->first();
        if (!$inhouse) {
            return response()->json(['error' => 'Não encontrada.'], 404);
        }

        // Ownership: só quem criou (ou admin) pode editar. Sem essa checagem
        // qualquer user logado podia reescrever inhouses alheios.
        $user = $request->user();
        if ($inhouse->created_by_user_id !== $user->id && !$user->is_admin) {
            return response()->json(['error' => 'Sem permissão.'], 403);
        }

        $data = $request->validate([
            'payload' => 'required|array',
        ]);

        $current = $inhouse->payload ?? [];
        $incoming = $data['payload'];
        $merged = array_merge($current, $incoming);

        $inhouse->update(['payload' => $merged]);

        // Dispara o webhook do Discord quando o inhouse "fica pronto" pela
        // primeira vez (ex.: último player que estava no pool foi draftado
        // no modo líder). maybeNotifyDiscord checa a flag interna pra não
        // notificar duas vezes.
        $this->maybeNotifyDiscord($inhouse->fresh(), $inhouse->createdBy);

        return response()->json($this->serialize($inhouse->fresh()));
    }

    /**
     * Marca o vencedor de um inhouse e credita moedas pra todos os players
     * (vitória pro time vencedor, derrota pro outro). Operação one-shot:
     * uma vez setado, o winner fica travado pra não creditar duas vezes.
     */
    public function setWinner(Request $request, string $shortCode)
    {
        $data = $request->validate([
            'winner' => 'required|string|in:blue,red',
        ]);

        $user = $request->user();
        $winner = $data['winner'];

        // Transaction com lock pra evitar double-credit em chamadas paralelas.
        $result = DB::transaction(function () use ($shortCode, $user, $winner) {
            $inhouse = Inhouse::where('short_code', $shortCode)
                ->lockForUpdate()
                ->first();
            if (!$inhouse) {
                return ['error' => 'Não encontrada.', 'status' => 404];
            }
            if ($inhouse->created_by_user_id !== $user->id && !$user->is_admin) {
                return ['error' => 'Sem permissão.', 'status' => 403];
            }
            if (!$inhouse->isComplete()) {
                return ['error' => 'O inhouse ainda tem jogadores no pool.', 'status' => 422];
            }
            $payload = is_array($inhouse->payload) ? $inhouse->payload : [];
            if (!empty($payload['winner'])) {
                return ['error' => 'Vencedor já foi definido.', 'status' => 422];
            }

            // Carrega as recompensas atuais. Defaults batendo com
            // AppSettingsController pra não dar 0 se ainda não configurou.
            $rewards = AppSetting::get('coin_rewards', [
                'inhouse' => ['win' => 60, 'loss' => 20],
            ]);
            $winAmount  = (int)($rewards['inhouse']['win']  ?? 60);
            $lossAmount = (int)($rewards['inhouse']['loss'] ?? 20);

            $players = $payload['players'] ?? [];
            $credited = [];
            foreach ($players as $p) {
                $playerSide = $p['side'] ?? null;
                $playerSlug = $p['id'] ?? null;
                if (!$playerSlug || !in_array($playerSide, ['blue', 'red'], true)) {
                    continue;
                }
                $player = User::where('slug', $playerSlug)->first();
                if (!$player) continue;

                $delta = $playerSide === $winner ? $winAmount : $lossAmount;
                $coin = MemberCoin::firstOrCreate(
                    ['user_id' => $player->id],
                    ['balance' => 0],
                );
                $coin->balance = $coin->balance + $delta;
                $coin->save();

                $credited[] = [
                    'userId'  => $player->id,
                    'slug'    => $player->slug,
                    'side'    => $playerSide,
                    'delta'   => $delta,
                    'balance' => (int)$coin->balance,
                ];
            }

            $payload['winner']           = $winner;
            $payload['winnerSetBy']      = $user->id;
            $payload['winnerSetAt']      = now()->getTimestampMs();
            $payload['winnerCreditedAt'] = now()->getTimestampMs();
            $payload['winnerCredited']   = $credited;
            $inhouse->update(['payload' => $payload]);

            return ['inhouse' => $inhouse->fresh(), 'credited' => $credited];
        });

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], $result['status']);
        }
        return response()->json([
            'inhouse'  => $this->serialize($result['inhouse']),
            'credited' => $result['credited'],
        ]);
    }

    public function destroy(Request $request, string $shortCode)
    {
        $inhouse = Inhouse::where('short_code', $shortCode)->first();
        if (!$inhouse) return response()->json(null, 204);

        $user = $request->user();
        if ($inhouse->created_by_user_id !== $user->id && !$user->is_admin) {
            return response()->json(['error' => 'Sem permissão.'], 403);
        }
        $inhouse->delete();
        return response()->json(null, 204);
    }

    private function serialize(Inhouse $i): array
    {
        return [
            'id'        => 'inhouse-' . $i->id,
            'shortCode' => $i->short_code,
            'payload'   => $i->payload,
            'createdAt' => $i->created_at?->getTimestampMs() ?? 0,
            'createdBy' => $i->created_by_user_id,
        ];
    }

    /**
     * Orquestra os dois disparos do webhook (idempotente por flags no payload):
     *
     *  1. discordCreatedFired — sempre dispara na criação ("Novo Inhouse criado!").
     *     No random mode já mostra membros (porque está completo).
     *     No leader mode mostra só líderes (espera draft).
     *
     *  2. discordReadyFired — só dispara depois do draft fechar, no leader mode.
     *     ("Times prontos!" com membros). No random mode já fica marcado junto
     *     com o created pra nunca disparar.
     */
    private function maybeNotifyDiscord(Inhouse $inhouse, $creator): void
    {
        $payload = is_array($inhouse->payload) ? $inhouse->payload : [];
        $complete = $inhouse->isComplete();

        // Fase 1: anúncio de criação. Só rola uma vez.
        if (empty($payload['discordCreatedFired'])) {
            DiscordWebhook::notifyInhouseCreated($inhouse, $creator, 'created');
            $payload['discordCreatedFired'] = true;
            // Random mode já vem completo, então a mensagem "created" já
            // mostrou membros → marca ready também pra não disparar de novo
            // se o admin mover algum player pra pool e voltar.
            if ($complete) {
                $payload['discordReadyFired'] = true;
            }
            $inhouse->update(['payload' => $payload]);
            return;
        }

        // Fase 2: anúncio de "times prontos" — só dispara depois do draft.
        if (empty($payload['discordReadyFired']) && $complete) {
            DiscordWebhook::notifyInhouseCreated($inhouse->fresh(), $creator, 'ready');
            $payload['discordReadyFired'] = true;
            $inhouse->update(['payload' => $payload]);
        }
    }

    private function generateShortCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = strtoupper(Str::random(4) . '-' . Str::random(4));
            if (!Inhouse::where('short_code', $code)->exists()) {
                return $code;
            }
        }
        // Fallback no improvável caso de 10 colisões.
        return strtoupper(substr(md5(uniqid()), 0, 4) . '-' . substr(md5(uniqid()), 0, 4));
    }
}

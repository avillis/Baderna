<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inhouse;
use App\Services\DiscordWebhook;
use Illuminate\Http\Request;
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

        // Dispara webhook do Discord (no-op se DISCORD_INHOUSE_WEBHOOK_URL
        // não estiver no .env). Defensivo: nunca derruba a resposta da API
        // se o Discord estiver fora.
        DiscordWebhook::notifyInhouseCreated($inhouse, $request->user());

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

        return response()->json($this->serialize($inhouse->fresh()));
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

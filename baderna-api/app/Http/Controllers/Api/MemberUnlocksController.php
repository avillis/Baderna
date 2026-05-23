<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberCoin;
use App\Models\MemberUnlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberUnlocksController extends Controller
{
    private const KINDS = ['title', 'capa', 'name'];

    /**
     * Custo server-side por tipo de spin. NUNCA confie no preço enviado pelo
     * cliente — esses valores são autoritativos. Mantenha em sync com o
     * front (capas-board.tsx).
     */
    private const SPIN_COST = [
        'capa'  => 10,
        'title' => 50,
        'name'  => 80,
    ];

    /**
     * Lista todos os unlocks do usuário logado.
     * Resposta: { title: [...slugs], capa: [...], name: [...] }
     */
    public function index(Request $request)
    {
        $rows = $request->user()->memberUnlocks()->get(['kind', 'slug']);
        $out = ['title' => [], 'capa' => [], 'name' => []];
        foreach ($rows as $r) {
            $out[$r->kind][] = $r->slug;
        }
        return response()->json($out);
    }

    /**
     * Compra (spin) um unlock pro próprio usuário. Debita moedas atomicamente
     * usando preço SERVER-SIDE — preço enviado pelo cliente é ignorado.
     *
     * Caso o item já esteja desbloqueado (duplicate), devolve o custo na hora
     * (mantém compatibilidade com a UI da loja que mostra "refund de duplicada").
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => 'required|string|in:' . implode(',', self::KINDS),
            'slug' => 'required|string|max:120',
        ]);

        $user = $request->user();
        $cost = self::SPIN_COST[$data['kind']] ?? 0;

        $result = DB::transaction(function () use ($user, $data, $cost) {
            // Lock pessimista no MemberCoin pra evitar race de double-spend.
            $coin = MemberCoin::lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0],
            );

            if ($coin->balance < $cost) {
                return ['error' => 'Saldo insuficiente.', 'status' => 422];
            }

            // Já tem? "Refund de duplicada" → não cobra nada.
            $exists = MemberUnlock::where('user_id', $user->id)
                ->where('kind', $data['kind'])
                ->where('slug', $data['slug'])
                ->exists();

            if (!$exists) {
                $coin->balance -= $cost;
                $coin->save();
                MemberUnlock::create([
                    'user_id' => $user->id,
                    'kind'    => $data['kind'],
                    'slug'    => $data['slug'],
                ]);
            }

            return [
                'kind' => $data['kind'],
                'slug' => $data['slug'],
                'balance' => $coin->balance,
                'duplicate' => $exists,
                'status' => 201,
            ];
        });

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], $result['status']);
        }

        $status = $result['status'];
        unset($result['status']);
        return response()->json($result, $status);
    }

    /**
     * Admin lista todos os unlocks de qualquer membro.
     */
    public function adminIndex(int $user)
    {
        $rows = MemberUnlock::where('user_id', $user)->get(['kind', 'slug']);
        $out = ['title' => [], 'capa' => [], 'name' => []];
        foreach ($rows as $r) {
            $out[$r->kind][] = $r->slug;
        }
        return response()->json($out);
    }

    /**
     * Admin pode conceder unlocks pra qualquer membro (member id = user_id).
     */
    public function adminGrant(Request $request, int $user)
    {
        $data = $request->validate([
            'kind' => 'required|string|in:' . implode(',', self::KINDS),
            'slug' => 'required|string|max:120',
        ]);

        MemberUnlock::firstOrCreate([
            'user_id' => $user,
            'kind'    => $data['kind'],
            'slug'    => $data['slug'],
        ]);

        return response()->json($data, 201);
    }

    /**
     * Admin pode também revogar.
     */
    public function adminRevoke(int $user, string $kind, string $slug)
    {
        MemberUnlock::where('user_id', $user)
            ->where('kind', $kind)
            ->where('slug', $slug)
            ->delete();
        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\MemberCoin;
use App\Models\MemberUnlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberUnlocksController extends Controller
{
    private const KINDS = ['title', 'capa', 'name', 'moldura'];

    /**
     * Custo server-side por tipo de spin (roleta). NUNCA confie no preço
     * enviado pelo cliente — esses valores são autoritativos.
     */
    private const SPIN_COST = [
        'capa'  => 10,
        'title' => 50,
        'name'  => 80,
    ];

    /**
     * Preço server-side por slug de moldura de nível.
     * Mantém em sync com molduras-data.ts no frontend.
     */
    private const MOLDURA_PRICE = [
        'level-frame-1'   => 50,
        'level-frame-30'  => 100,
        'level-frame-50'  => 150,
        'level-frame-75'  => 200,
        'level-frame-100' => 250,
        'level-frame-125' => 350,
        'level-frame-150' => 450,
        'level-frame-175' => 550,
        'level-frame-200' => 650,
        'level-frame-225' => 750,
        'level-frame-250' => 850,
        'level-frame-275' => 970,
        'level-frame-300' => 1090,
        'level-frame-325' => 1210,
        'level-frame-350' => 1330,
        'level-frame-375' => 1450,
        'level-frame-425' => 1850,
        'level-frame-450' => 2050,
        'level-frame-475' => 2250,
        'level-frame-500' => 2450,
    ];

    /**
     * Lista todos os unlocks do usuário logado.
     * Resposta: { title: [...slugs], capa: [...], name: [...] }
     */
    public function index(Request $request)
    {
        $rows = $request->user()->memberUnlocks()->get(['kind', 'slug']);
        $out = ['title' => [], 'capa' => [], 'name' => [], 'moldura' => []];
        foreach ($rows as $r) {
            if (array_key_exists($r->kind, $out)) {
                $out[$r->kind][] = $r->slug;
            }
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
            'free' => 'sometimes|boolean',
        ]);

        $user = $request->user();

        // Molduras têm preço por slug (não por tipo). Slug desconhecido = inválido.
        if ($data['kind'] === 'moldura') {
            if (!array_key_exists($data['slug'], self::MOLDURA_PRICE)) {
                return response()->json(['error' => 'Moldura inválida.'], 422);
            }
            $cost = self::MOLDURA_PRICE[$data['slug']];
        } else {
            // Free só é válido pra capas (único tipo com free spin na UI)
            $isFree = !empty($data['free']) && $data['kind'] === 'capa';
            // Custo dinâmico via AppSetting (admin pode ajustar); fallback pro valor fixo
            $costs = AppSetting::get('store_prices', self::SPIN_COST);
            $cost = $isFree ? 0 : ($costs[$data['kind']] ?? self::SPIN_COST[$data['kind']] ?? 0);
        }

        $result = DB::transaction(function () use ($user, $data, $cost) {
            $coin = MemberCoin::lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0],
            );

            if ($cost > 0 && $coin->balance < $cost) {
                return ['error' => 'Saldo insuficiente.', 'status' => 422];
            }

            $exists = MemberUnlock::where('user_id', $user->id)
                ->where('kind', $data['kind'])
                ->where('slug', $data['slug'])
                ->exists();

            if (!$exists) {
                if ($cost > 0) {
                    $coin->balance -= $cost;
                    $coin->save();
                }
                MemberUnlock::create([
                    'user_id' => $user->id,
                    'kind'    => $data['kind'],
                    'slug'    => $data['slug'],
                ]);
            }

            return [
                'kind'      => $data['kind'],
                'slug'      => $data['slug'],
                'balance'   => $coin->balance,
                'duplicate' => $exists,
                'status'    => 201,
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
        $out = ['title' => [], 'capa' => [], 'name' => [], 'moldura' => []];
        foreach ($rows as $r) {
            if (array_key_exists($r->kind, $out)) {
                $out[$r->kind][] = $r->slug;
            }
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

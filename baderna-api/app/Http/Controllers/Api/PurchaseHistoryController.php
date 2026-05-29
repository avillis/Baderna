<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberPurchaseHistory;
use Illuminate\Http\Request;

class PurchaseHistoryController extends Controller
{
    /** Histórico de compras (spins) do usuário logado — mais recentes primeiro. */
    public function index(Request $request)
    {
        $rows = MemberPurchaseHistory::where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        return response()->json($rows->map(fn ($r) => [
            'id'           => (string) $r->id,
            'timestamp'    => $r->created_at?->getTimestampMs() ?? 0,
            'kind'         => $r->kind,
            'itemId'       => $r->item_id,
            'itemLabel'    => $r->item_label,
            'rarity'       => $r->rarity,
            'cost'         => (int) $r->cost,
            'refunded'     => (bool) $r->refunded,
            'free'         => (bool) $r->free,
            'balanceAfter' => (int) $r->balance_after,
        ]));
    }

    /**
     * Registra uma compra no histórico. Log cosmético (a cobrança real é
     * feita/validada no /account/unlocks); aqui só guarda pra exibir.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'kind'         => 'required|string|in:capa,titulo,nome',
            'itemId'       => 'required|string|max:160',
            'itemLabel'    => 'required|string|max:200',
            'rarity'       => 'required|string|max:32',
            'cost'         => 'required|integer|min:0',
            'refunded'     => 'sometimes|boolean',
            'free'         => 'sometimes|boolean',
            'balanceAfter' => 'required|integer',
        ]);

        $row = MemberPurchaseHistory::create([
            'user_id'       => $request->user()->id,
            'kind'          => $data['kind'],
            'item_id'       => $data['itemId'],
            'item_label'    => $data['itemLabel'],
            'rarity'        => $data['rarity'],
            'cost'          => $data['cost'],
            'refunded'      => (bool) ($data['refunded'] ?? false),
            'free'          => (bool) ($data['free'] ?? false),
            'balance_after' => $data['balanceAfter'],
        ]);

        return response()->json(['id' => (string) $row->id], 201);
    }
}

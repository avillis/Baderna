<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberCoin;
use App\Models\User;
use Illuminate\Http\Request;

class MemberCoinsController extends Controller
{
    /**
     * Lista todos os usuários com seus saldos (admin).
     */
    public function index()
    {
        $rows = User::leftJoin('member_coins', 'users.id', '=', 'member_coins.user_id')
            ->where('users.is_deleted', false)
            ->select(
                'users.id',
                'users.name',
                'users.display_name',
                'users.summoner_name',
                'users.tagLine',
                'users.avatar_src',
                'member_coins.balance',
            )
            ->orderBy('users.id')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->display_name ?: $u->name,
                    'summonerName' => $u->summoner_name,
                    'tagLine' => $u->tagLine,
                    'avatarSrc' => $u->avatar_src,
                    'balance' => (int)($u->balance ?? 0),
                ];
            });

        return response()->json($rows);
    }

    /**
     * Retorna saldo do próprio usuário.
     */
    public function me(Request $request)
    {
        $balance = $request->user()->memberCoins?->balance ?? 0;
        return response()->json(['balance' => (int)$balance]);
    }

    /**
     * Admin define saldo de qualquer membro.
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'balance' => 'required|integer|min:0',
        ]);

        MemberCoin::updateOrCreate(
            ['user_id' => $user->id],
            ['balance' => $data['balance']],
        );

        return response()->json(['user_id' => $user->id, 'balance' => $data['balance']]);
    }

    /**
     * Operação atômica de crédito/débito pra evitar race condition no front.
     * delta pode ser negativo.
     */
    public function adjust(Request $request)
    {
        $data = $request->validate([
            'delta' => 'required|integer',
        ]);

        $user = $request->user();
        $coin = MemberCoin::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $coin->balance = max(0, $coin->balance + $data['delta']);
        $coin->save();

        return response()->json(['balance' => $coin->balance]);
    }
}

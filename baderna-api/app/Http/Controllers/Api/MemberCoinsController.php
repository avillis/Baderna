<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FlexCreditService;
use App\Services\RiotAPIServices;
use App\Models\MemberCoin;
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
     * Admin batch: pra cada member com Riot ID, busca as ultimas N partidas
     * Flex (default 5) e credita as que ainda nao foram. Idempotente —
     * uma mesma partida nunca credita duas vezes (unique em
     * flex_match_credits.user_id+match_id).
     */
    public function flexCreditBatch(Request $request, RiotAPIServices $riot, FlexCreditService $credits)
    {
        $lookback = (int)$request->input('lookback', 5);
        if ($lookback < 1 || $lookback > 50) $lookback = 5;

        $members = User::where('is_deleted', false)
            ->whereNotNull('riot_puuid')
            ->get(['id', 'name', 'display_name', 'riot_puuid']);

        $rows = [];
        $totalCredited = 0;
        $totalMatches = 0;

        foreach ($members as $u) {
            try {
                $r = $credits->creditUser($u, $riot, $lookback);
                $totalCredited += $r['totalDelta'];
                $totalMatches  += $r['matchesCredited'];
                $rows[] = [
                    'userId'          => $u->id,
                    'name'            => $u->display_name ?: $u->name,
                    'matchesCredited' => $r['matchesCredited'],
                    'matchesSkipped'  => $r['matchesSkipped'],
                    'totalDelta'      => $r['totalDelta'],
                ];
            } catch (\Exception $e) {
                $rows[] = [
                    'userId' => $u->id,
                    'name'   => $u->display_name ?: $u->name,
                    'error'  => substr($e->getMessage(), 0, 200),
                ];
            }
        }

        return response()->json([
            'lookback'      => $lookback,
            'totalUsers'    => $members->count(),
            'totalMatches'  => $totalMatches,
            'totalCredited' => $totalCredited,
            'rows'          => $rows,
        ]);
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

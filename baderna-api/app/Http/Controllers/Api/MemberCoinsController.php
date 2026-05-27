<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\FlexMatchCredit;
use App\Models\MemberCoin;
use App\Models\User;
use App\Services\RiotAPIServices;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
    public function flexCreditBatch(Request $request, RiotAPIServices $riot)
    {
        $lookback = (int)$request->input('lookback', 5);
        if ($lookback < 1 || $lookback > 50) $lookback = 5;

        $rewards = AppSetting::get('coin_rewards', [
            'flex' => ['win' => 20, 'loss' => 10],
        ]);
        $winAmount  = (int)($rewards['flex']['win']  ?? 20);
        $lossAmount = (int)($rewards['flex']['loss'] ?? 10);

        $members = User::where('is_deleted', false)
            ->whereNotNull('riot_puuid')
            ->get(['id', 'name', 'display_name', 'riot_puuid']);

        $rows = [];
        $totalCredited = 0;
        $totalMatches = 0;

        foreach ($members as $u) {
            try {
                $r = $this->creditOneUserFlex($u, $riot, $lookback, $winAmount, $lossAmount);
                $totalCredited += $r['totalDelta'];
                $totalMatches  += $r['matchesCredited'];
                $rows[] = [
                    'userId'           => $u->id,
                    'name'             => $u->display_name ?: $u->name,
                    'matchesCredited'  => $r['matchesCredited'],
                    'matchesSkipped'   => $r['matchesSkipped'],
                    'totalDelta'       => $r['totalDelta'],
                ];
            } catch (Exception $e) {
                $rows[] = [
                    'userId' => $u->id,
                    'name'   => $u->display_name ?: $u->name,
                    'error'  => substr($e->getMessage(), 0, 200),
                ];
            }
        }

        return response()->json([
            'lookback'        => $lookback,
            'winAmount'       => $winAmount,
            'lossAmount'      => $lossAmount,
            'totalUsers'      => $members->count(),
            'totalMatches'    => $totalMatches,
            'totalCredited'   => $totalCredited,
            'rows'            => $rows,
        ]);
    }

    /**
     * Pra um user: pega ultimas $lookback partidas Flex, credita as
     * que nao estao em flex_match_credits ainda. Roda em transaction
     * por match pra ser idempotente.
     */
    private function creditOneUserFlex(
        User $user,
        RiotAPIServices $riot,
        int $lookback,
        int $winAmount,
        int $lossAmount,
    ): array {
        if (!$user->riot_puuid) {
            return ['matchesCredited' => 0, 'matchesSkipped' => 0, 'totalDelta' => 0];
        }

        $matchIds = $riot->getMatchIdsByPUUID($user->riot_puuid, $lookback, 440);
        if (empty($matchIds)) {
            return ['matchesCredited' => 0, 'matchesSkipped' => 0, 'totalDelta' => 0];
        }

        $alreadyCredited = FlexMatchCredit::where('user_id', $user->id)
            ->whereIn('match_id', $matchIds)
            ->pluck('match_id')
            ->all();

        $matchesCredited = 0;
        $matchesSkipped  = count($alreadyCredited);
        $totalDelta      = 0;

        foreach ($matchIds as $matchId) {
            if (in_array($matchId, $alreadyCredited, true)) continue;

            $detail = $riot->getMatchDetail($matchId);
            $participants = $detail['info']['participants'] ?? [];
            $viewer = null;
            foreach ($participants as $p) {
                if (($p['puuid'] ?? null) === $user->riot_puuid) {
                    $viewer = $p;
                    break;
                }
            }
            if (!$viewer) {
                $matchesSkipped++;
                continue;
            }

            $won = (bool)($viewer['win'] ?? false);
            $delta = $won ? $winAmount : $lossAmount;

            DB::transaction(function () use ($user, $matchId, $won, $delta) {
                // firstOrCreate evita race; a unique no DB garante
                // que se rodar 2x em paralelo, só uma credita.
                $alreadyExists = FlexMatchCredit::where('user_id', $user->id)
                    ->where('match_id', $matchId)
                    ->lockForUpdate()
                    ->exists();
                if ($alreadyExists) return;

                FlexMatchCredit::create([
                    'user_id'  => $user->id,
                    'match_id' => $matchId,
                    'is_win'   => $won,
                    'delta'    => $delta,
                ]);
                $coin = MemberCoin::firstOrCreate(
                    ['user_id' => $user->id],
                    ['balance' => 0],
                );
                $coin->balance = $coin->balance + $delta;
                $coin->save();
            });

            $matchesCredited++;
            $totalDelta += $delta;
        }

        return [
            'matchesCredited' => $matchesCredited,
            'matchesSkipped'  => $matchesSkipped,
            'totalDelta'      => $totalDelta,
        ];
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

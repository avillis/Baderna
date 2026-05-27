<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\FlexMatchCredit;
use App\Models\MemberCoin;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

/**
 * Serviço de crédito automático de moedas por partidas Flex.
 *
 * Idempotente: a tabela flex_match_credits (unique user_id+match_id) +
 * lockForUpdate dentro da transaction garantem que uma partida nunca
 * credita duas vezes, mesmo que o método seja chamado concorrentemente.
 */
class FlexCreditService
{
    private const QUEUE_FLEX = 440;

    /**
     * Credita moedas de partidas Flex novas para um único usuário.
     *
     * @param  User             $user
     * @param  RiotAPIServices  $riot
     * @param  int              $lookback  Quantas partidas recentes verificar (default 20)
     * @return array{matchesCredited:int, matchesSkipped:int, totalDelta:int}
     */
    public function creditUser(User $user, RiotAPIServices $riot, int $lookback = 20): array
    {
        if (!$user->riot_puuid) {
            return ['matchesCredited' => 0, 'matchesSkipped' => 0, 'totalDelta' => 0];
        }

        $rewards = AppSetting::get('coin_rewards', [
            'flex' => ['win' => 20, 'loss' => 10],
        ]);
        $winAmount  = (int)($rewards['flex']['win']  ?? 20);
        $lossAmount = (int)($rewards['flex']['loss'] ?? 10);

        $matchIds = $riot->getMatchIdsByPUUID($user->riot_puuid, $lookback, self::QUEUE_FLEX);
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

            try {
                $detail = $riot->getMatchDetail($matchId);
            } catch (Exception $e) {
                $matchesSkipped++;
                continue;
            }

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

            $won   = (bool)($viewer['win'] ?? false);
            $delta = $won ? $winAmount : $lossAmount;

            DB::transaction(function () use ($user, $matchId, $won, $delta) {
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
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RiotAPIServices;
use Exception;
use Illuminate\Support\Carbon;

class MemberRanksController extends Controller
{
    private const REFRESH_TTL_HOURS = 6;

    /**
     * Lista o rank em cache de todos os membros. Refresca quem tá stale
     * (mais velho que TTL) sob demanda — limitado a N por request pra não
     * estourar rate limit da Riot.
     */
    public function index(RiotAPIServices $riot)
    {
        $users = User::where('is_deleted', false)
            ->whereNotNull('summoner_name')
            ->whereNotNull('tagLine')
            ->get();

        $stale = $users->filter(function ($u) {
            if (!$u->cached_rank_at) return true;
            return $u->cached_rank_at->lt(Carbon::now()->subHours(self::REFRESH_TTL_HOURS));
        });

        // Refresca no máximo 15 stale por request (resto pega na próxima visita).
        // 15 = cabe a Baderna inteira numa visita sem estourar rate limit Riot.
        foreach ($stale->take(15) as $user) {
            $this->refreshOne($user, $riot);
        }

        // Re-pega após updates
        $users = $users->fresh();

        return response()->json($users->map(fn ($u) => [
            'userId'   => $u->id,
            'tier'     => $u->cached_rank_tier,
            'division' => $u->cached_rank_division,
            'lp'       => $u->cached_rank_lp,
            'updatedAt' => $u->cached_rank_at?->getTimestampMs(),
        ]));
    }

    private function refreshOne(User $user, RiotAPIServices $riot): void
    {
        try {
            // Resolve PUUID se ainda não temos
            if (!$user->riot_puuid) {
                $account = $riot->getPlayerPUUIDByRiotId(
                    $user->summoner_name,
                    $user->tagLine,
                );
                if (!empty($account['puuid'])) {
                    $user->riot_puuid = $account['puuid'];
                }
            }
            if (!$user->riot_puuid) return;

            $rank = $riot->getPlayerDataByPUUID($user->riot_puuid);
            $user->cached_rank_tier = $rank['tier'] ?? 'Unranked';
            $user->cached_rank_division = $rank['division'] ?? null;
            $user->cached_rank_lp = $rank['league_points'] ?? 0;
            $user->cached_rank_at = Carbon::now();
            $user->save();
        } catch (Exception $e) {
            // Marca como visitado pra não tentar de novo todo request — falha
            // continua até TTL passar.
            $user->cached_rank_at = Carbon::now();
            $user->save();
        }
    }
}

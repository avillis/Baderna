<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RiotAPIServices;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MemberWinratesController extends Controller
{
    private const QUEUE_FLEX = 440;
    private const MAX_MATCHES_PER_SYNC = 100;

    /**
     * Retorna o winrate do user logado COM cada outro membro da Baderna,
     * computado a partir das partidas Flex da season atual.
     *
     * Resposta: [{ memberId, name, summonerName, avatarSrc, wins, losses }, ...]
     *
     * Estratégia: cacheado por (puuid, season) por 1h. Primeira carga pode
     * demorar (200+ API calls). Depois é instantâneo até expirar.
     */
    public function index(Request $request, RiotAPIServices $riot)
    {
        $user = $request->user();
        if (!$user->riot_puuid) {
            return response()->json(['rows' => []]);
        }

        $seasonId = $riot->getCurrentSeasonId();
        $cacheKey = "winrates_with_members:{$user->riot_puuid}:{$seasonId}";

        $rows = Cache::remember($cacheKey, now()->addHour(), function () use ($user, $riot) {
            return $this->computeWinrates($user, $riot);
        });

        return response()->json(['rows' => $rows]);
    }

    /**
     * Força refresh limpando o cache + recomputando.
     */
    public function refresh(Request $request, RiotAPIServices $riot)
    {
        $user = $request->user();
        if (!$user->riot_puuid) {
            return response()->json(['rows' => []]);
        }
        $seasonId = $riot->getCurrentSeasonId();
        Cache::forget("winrates_with_members:{$user->riot_puuid}:{$seasonId}");
        $rows = $this->computeWinrates($user, $riot);
        Cache::put("winrates_with_members:{$user->riot_puuid}:{$seasonId}", $rows, now()->addHour());
        return response()->json(['rows' => $rows]);
    }

    private function computeWinrates(User $user, RiotAPIServices $riot): array
    {
        // 1. Mapa PUUID → User row pra todos os baderna members (exclui o próprio)
        $members = User::where('is_deleted', false)
            ->whereNotNull('riot_puuid')
            ->where('id', '!=', $user->id)
            ->get(['id', 'name', 'display_name', 'summoner_name', 'tagLine', 'avatar_src', 'riot_puuid']);

        $byPuuid = [];
        foreach ($members as $m) {
            $byPuuid[$m->riot_puuid] = $m;
        }

        if (empty($byPuuid)) return [];

        // 2. Pega IDs das partidas Flex da season
        try {
            $matchIds = $riot->getSeasonMatchIds(
                $user->riot_puuid,
                self::QUEUE_FLEX,
                self::MAX_MATCHES_PER_SYNC,
            );
        } catch (Exception) {
            return [];
        }

        // 3. Pra cada partida, identifica time do viewer e teammates baderna
        $tallies = []; // puuid => ['wins' => x, 'losses' => y]
        foreach ($matchIds as $matchId) {
            try {
                $detail = $riot->getMatchDetail($matchId);
            } catch (Exception) {
                continue;
            }
            $participants = $detail['info']['participants'] ?? [];
            if (!is_array($participants) || count($participants) === 0) continue;

            // Acha o viewer na lista
            $viewer = null;
            foreach ($participants as $p) {
                if (($p['puuid'] ?? null) === $user->riot_puuid) {
                    $viewer = $p;
                    break;
                }
            }
            if (!$viewer) continue;

            $viewerTeam = $viewer['teamId'] ?? null;
            $viewerWon = (bool)($viewer['win'] ?? false);

            foreach ($participants as $p) {
                $pPuuid = $p['puuid'] ?? null;
                if (!$pPuuid || $pPuuid === $user->riot_puuid) continue;
                if (!isset($byPuuid[$pPuuid])) continue; // não é da baderna
                if (($p['teamId'] ?? null) !== $viewerTeam) continue; // não é teammate

                if (!isset($tallies[$pPuuid])) {
                    $tallies[$pPuuid] = ['wins' => 0, 'losses' => 0];
                }
                if ($viewerWon) {
                    $tallies[$pPuuid]['wins']++;
                } else {
                    $tallies[$pPuuid]['losses']++;
                }
            }
        }

        // 4. Monta resposta ordenada por total de jogos (desc)
        $rows = [];
        foreach ($tallies as $puuid => $tally) {
            $m = $byPuuid[$puuid];
            $rows[] = [
                'memberId'     => $m->id,
                'name'         => $m->display_name ?: $m->name,
                'summonerName' => $m->summoner_name,
                'avatarSrc'    => $m->avatar_src,
                'wins'         => $tally['wins'],
                'losses'       => $tally['losses'],
            ];
        }
        usort($rows, fn ($a, $b) =>
            ($b['wins'] + $b['losses']) - ($a['wins'] + $a['losses'])
        );

        return $rows;
    }
}

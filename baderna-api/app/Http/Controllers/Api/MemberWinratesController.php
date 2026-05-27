<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ErrorLog;
use App\Models\User;
use App\Services\FlexCreditService;
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
            return response()->json([
                'rows' => [],
                'debug' => ['reason' => 'self_no_puuid'],
            ]);
        }

        $seasonId = $riot->getCurrentSeasonId();
        $cacheKey = "winrates_with_members:{$user->riot_puuid}:{$seasonId}";

        $result = Cache::remember($cacheKey, now()->addHour(), function () use ($user, $riot) {
            return $this->computeWinrates($user, $riot);
        });

        return response()->json($result);
    }

    /**
     * Força refresh limpando o cache + recomputando.
     * Aproveita o refresh pra creditar partidas Flex novas automaticamente.
     */
    public function refresh(Request $request, RiotAPIServices $riot, FlexCreditService $credits)
    {
        $user = $request->user();
        if (!$user->riot_puuid) {
            return response()->json([
                'rows' => [],
                'debug' => ['reason' => 'self_no_puuid'],
            ]);
        }
        $seasonId = $riot->getCurrentSeasonId();
        Cache::forget("winrates_with_members:{$user->riot_puuid}:{$seasonId}");
        $result = $this->computeWinrates($user, $riot);
        Cache::put("winrates_with_members:{$user->riot_puuid}:{$seasonId}", $result, now()->addHour());

        // Credita automaticamente partidas Flex novas (idempotente).
        // lookback=20 cobre ~2 semanas de jogos regulares sem chamar mais API calls do que o necessário.
        try {
            $credits->creditUser($user, $riot, 20);
        } catch (Exception $ignored) {
            // Crédito falhou silenciosamente — winrates ainda são retornados normalmente.
        }

        return response()->json($result);
    }

    /**
     * Winrate de QUALQUER member (perfil de terceiros). Mesma lógica do
     * index() mas pra um user passado na rota — usado quando o admin/qualquer
     * logado abre o perfil de outra pessoa e quer ver os winrates dela.
     */
    public function showForMember(int $user, RiotAPIServices $riot)
    {
        $target = User::where('is_deleted', false)->find($user);
        if (!$target || !$target->riot_puuid) {
            return response()->json([
                'rows' => [],
                'debug' => ['reason' => 'target_no_puuid'],
            ]);
        }

        $seasonId = $riot->getCurrentSeasonId();
        $cacheKey = "winrates_with_members:{$target->riot_puuid}:{$seasonId}";

        $result = Cache::remember($cacheKey, now()->addHour(), function () use ($target, $riot) {
            return $this->computeWinrates($target, $riot);
        });

        return response()->json($result);
    }

    public function refreshForMember(int $user, RiotAPIServices $riot)
    {
        $target = User::where('is_deleted', false)->find($user);
        if (!$target || !$target->riot_puuid) {
            return response()->json([
                'rows' => [],
                'debug' => ['reason' => 'target_no_puuid'],
            ]);
        }
        $seasonId = $riot->getCurrentSeasonId();
        Cache::forget("winrates_with_members:{$target->riot_puuid}:{$seasonId}");
        $result = $this->computeWinrates($target, $riot);
        Cache::put("winrates_with_members:{$target->riot_puuid}:{$seasonId}", $result, now()->addHour());
        return response()->json($result);
    }

    /**
     * Retorna ['rows' => [...], 'debug' => {meta}]. Debug ajuda admin a
     * descobrir por que tá vazio (sem PUUID? sem partidas? Riot caiu?).
     */
    private function computeWinrates(User $user, RiotAPIServices $riot): array
    {
        $debug = [
            'season'             => $riot->getCurrentSeasonId(),
            'matches_found'      => 0,
            'matches_fetched'    => 0,
            'matches_failed'     => 0,
            'members_with_puuid' => 0,
            'errors'             => [],
        ];

        $members = User::where('is_deleted', false)
            ->whereNotNull('riot_puuid')
            ->where('id', '!=', $user->id)
            ->get(['id', 'name', 'display_name', 'summoner_name', 'tagLine', 'avatar_src', 'riot_puuid']);

        $byPuuid = [];
        foreach ($members as $m) {
            $byPuuid[$m->riot_puuid] = $m;
        }
        $debug['members_with_puuid'] = count($byPuuid);

        if (empty($byPuuid)) {
            $debug['reason'] = 'no_other_members_with_puuid';
            return ['rows' => [], 'debug' => $debug];
        }

        try {
            $matchIds = $riot->getSeasonMatchIds(
                $user->riot_puuid,
                self::QUEUE_FLEX,
                self::MAX_MATCHES_PER_SYNC,
            );
            $debug['matches_found'] = count($matchIds);
        } catch (Exception $e) {
            $debug['reason'] = 'match_ids_fetch_failed';
            $debug['errors'][] = $e->getMessage();
            $this->logFail('getSeasonMatchIds failed', $e);
            return ['rows' => [], 'debug' => $debug];
        }

        if (count($matchIds) === 0) {
            $debug['reason'] = 'no_flex_matches_in_season';
            return ['rows' => [], 'debug' => $debug];
        }

        $tallies = [];
        foreach ($matchIds as $matchId) {
            try {
                $detail = $riot->getMatchDetail($matchId);
                $debug['matches_fetched']++;
            } catch (Exception $e) {
                $debug['matches_failed']++;
                if (count($debug['errors']) < 3) {
                    $debug['errors'][] = "match {$matchId}: " . $e->getMessage();
                }
                continue;
            }
            $participants = $detail['info']['participants'] ?? [];
            if (!is_array($participants) || count($participants) === 0) continue;

            $viewer = null;
            foreach ($participants as $p) {
                if (($p['puuid'] ?? null) === $user->riot_puuid) {
                    $viewer = $p;
                    break;
                }
            }
            if (!$viewer) continue;

            $viewerTeam = $viewer['teamId'] ?? null;
            $viewerWon  = (bool)($viewer['win'] ?? false);

            foreach ($participants as $p) {
                $pPuuid = $p['puuid'] ?? null;
                if (!$pPuuid || $pPuuid === $user->riot_puuid) continue;
                if (!isset($byPuuid[$pPuuid])) continue;
                if (($p['teamId'] ?? null) !== $viewerTeam) continue;

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

        if (count($tallies) === 0) {
            $debug['reason'] = 'no_teammates_found_in_matches';
        }

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

        return ['rows' => $rows, 'debug' => $debug];
    }

    /**
     * Best-effort logging — não quebra se a tabela não existir ainda.
     */
    private function logFail(string $message, Exception $e): void
    {
        try {
            ErrorLog::create([
                'source' => 'error',
                'level' => 'error',
                'message' => substr($message . ': ' . $e->getMessage(), 0, 1000),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => substr($e->getTraceAsString(), 0, 20000),
                'context' => ['where' => 'MemberWinratesController'],
                'occurred_at' => now(),
            ]);
        } catch (Exception $ignored) {}
    }
}

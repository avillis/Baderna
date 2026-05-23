<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Exception;

class RiotAPIServices
{
    protected $apiKey;
    protected string $baseUrl = 'https://br1.api.riotgames.com';
    protected string $americasBaseUrl = 'https://americas.api.riotgames.com';
    protected string $ddragonUrl = 'https://ddragon.leagueoflegends.com';

    public const SETTINGS_KEY = 'settings:riot_api_key';

    public function __construct()
    {
        // Prefere o valor sobrescrito via painel admin (cache); cai pro .env.
        $this->apiKey = Cache::get(self::SETTINGS_KEY) ?? env('RIOT_API_KEY');
    }

    protected function request(string $url)
    {
        $response = Http::withHeader('X-Riot-Token', $this->apiKey)->get($url);
        if ($response->failed()) {
            throw new Exception('Erro ao buscar dados na Riot: ' . $response->status());
        }
        return $response->json();
    }

    public function getPlayerPUUIDByRiotId(string $gameName, string $tagLine): array
    {
        $data = $this->request(
            "{$this->americasBaseUrl}/riot/account/v1/accounts/by-riot-id/" .
            rawurlencode($gameName) . "/" . rawurlencode($tagLine)
        );
        return [
            'puuid'    => $data['puuid']    ?? null,
            'gameName' => $data['gameName'] ?? $gameName,
            'tagLine'  => $data['tagLine']  ?? $tagLine,
        ];
    }

    /**
     * Pega o MAIOR rank do jogador comparando Solo/Duo, Flex e qualquer outra
     * fila ranqueada. Hierarquia: tier > division > LP. Empate → Solo/Duo
     * ganha (mais "prestígio").
     */
    public function getPlayerDataByPUUID(string $puuid): array
    {
        $entries = $this->request(
            "{$this->baseUrl}/lol/league/v4/entries/by-puuid/{$puuid}"
        );

        $best = null;
        $bestScore = -1;
        foreach ($entries ?? [] as $entry) {
            $score = $this->rankScore(
                $entry['tier'] ?? null,
                $entry['rank'] ?? null,
                $entry['leaguePoints'] ?? 0,
            );
            // Solo/Duo desempata por cima
            if ($score > $bestScore || (
                $score === $bestScore && ($entry['queueType'] ?? '') === 'RANKED_SOLO_5x5'
            )) {
                $best = $entry;
                $bestScore = $score;
            }
        }

        if (!$best) {
            return [
                'tier'          => 'Unranked',
                'division'      => null,
                'league_points' => 0,
                'wins'          => 0,
                'losses'        => 0,
                'queue_type'    => null,
            ];
        }

        return [
            'tier'          => $best['tier']         ?? 'Unranked',
            'division'      => $best['rank']         ?? null,   // I, II, III, IV (Riot calls this "rank")
            'league_points' => $best['leaguePoints'] ?? 0,
            'wins'          => $best['wins']         ?? 0,
            'losses'        => $best['losses']       ?? 0,
            'queue_type'    => $best['queueType']    ?? null,
        ];
    }

    private const TIER_ORDER = [
        'IRON'        => 1,
        'BRONZE'      => 2,
        'SILVER'      => 3,
        'GOLD'        => 4,
        'PLATINUM'    => 5,
        'EMERALD'     => 6,
        'DIAMOND'     => 7,
        'MASTER'      => 8,
        'GRANDMASTER' => 9,
        'CHALLENGER'  => 10,
    ];

    private const DIVISION_ORDER = ['IV' => 1, 'III' => 2, 'II' => 3, 'I' => 4];

    /**
     * Score numérico pra comparar rank: tier vale 10000, division vale 100, LP vale 1.
     * Apex tiers (Master+) não têm division — vira 0 + LP só.
     */
    private function rankScore(?string $tier, ?string $division, int $lp): int
    {
        $tierIdx = self::TIER_ORDER[strtoupper($tier ?? '')] ?? 0;
        if ($tierIdx === 0) return -1;
        $divIdx = self::DIVISION_ORDER[strtoupper($division ?? '')] ?? 0;
        return $tierIdx * 10000 + $divIdx * 100 + min(99, $lp);
    }

    public function getSummonerByPUUID(string $puuid): array
    {
        $data = $this->request(
            "{$this->baseUrl}/lol/summoner/v4/summoners/by-puuid/{$puuid}"
        );
        return [
            'summonerLevel'   => $data['summonerLevel']   ?? null,
            'profileIconId'   => $data['profileIconId']   ?? null,
            'revisionDate'    => $data['revisionDate']    ?? null,
        ];
    }

    /**
     * Última versão do Data Dragon. Cacheado 24h.
     */
    public function getDdragonVersion(): string
    {
        return Cache::remember('ddragon_latest_version', now()->addHours(24), function () {
            $versions = Http::get("{$this->ddragonUrl}/api/versions.json")->json();
            return $versions[0] ?? '15.1.1';
        });
    }

    /**
     * URL do ícone de perfil (avatar) do summoner via Data Dragon.
     */
    public function profileIconUrl(?int $iconId): ?string
    {
        if ($iconId === null) return null;
        $v = $this->getDdragonVersion();
        return "{$this->ddragonUrl}/cdn/{$v}/img/profileicon/{$iconId}.png";
    }

    /**
     * @param int      $count How many recent match IDs to fetch (max 100).
     * @param int|null $queue Optional Riot queue id to filter (440 = Flex, 420 = SoloDuo, ...).
     * @return string[]
     */
    public function getMatchIdsByPUUID(string $puuid, int $count = 10, ?int $queue = null): array
    {
        $count = max(1, min(100, $count));
        $url = "{$this->americasBaseUrl}/lol/match/v5/matches/by-puuid/{$puuid}/ids?start=0&count={$count}";
        if ($queue !== null) {
            $url .= "&queue={$queue}";
        }
        return $this->request($url);
    }

    public function getMatchDetail(string $matchId): array
    {
        return $this->request("{$this->americasBaseUrl}/lol/match/v5/matches/{$matchId}");
    }

    /**
     * Start timestamp (Unix segundos) da season ranqueada atual.
     * ATUALIZAR a cada nova season da Riot — sem isso o filtro fica errado.
     * 2026 Split 1 começou 8 jan 2026.
     */
    public function getSeasonStartTimestamp(): int
    {
        return strtotime('2026-01-08 00:00:00 UTC');
    }

    /**
     * Identificador legível da season — usado pra montar cache key, e zerar
     * automaticamente quando a season trocar (basta atualizar a string).
     */
    public function getCurrentSeasonId(): string
    {
        return '2026-s1';
    }

    /**
     * Match IDs da SEASON atual pro user, filtrado por fila. Pagina pelo
     * endpoint /by-puuid/{puuid}/ids (limite 100 por chamada). Coleta até
     * `maxMatches` no total ou para quando a Riot não devolver mais.
     */
    public function getSeasonMatchIds(string $puuid, int $queue, int $maxMatches = 100): array
    {
        $startTime = $this->getSeasonStartTimestamp();
        $all = [];
        $start = 0;
        $pageSize = min(100, $maxMatches);
        while (count($all) < $maxMatches) {
            $url = "{$this->americasBaseUrl}/lol/match/v5/matches/by-puuid/{$puuid}/ids"
                . "?startTime={$startTime}&start={$start}&count={$pageSize}&queue={$queue}";
            try {
                $ids = $this->request($url);
            } catch (Exception) {
                break;
            }
            if (!is_array($ids) || count($ids) === 0) break;
            $all = array_merge($all, $ids);
            if (count($ids) < $pageSize) break;
            $start += count($ids);
        }
        return array_slice($all, 0, $maxMatches);
    }

    /**
     * Returns a map of championId => championName built from Data Dragon.
     * Cached 24h since Riot rarely updates this file.
     */
    public function getChampionsById(): array
    {
        return Cache::remember('ddragon_champions_by_id', now()->addHours(24), function () {
            $versions = Http::get("{$this->ddragonUrl}/api/versions.json")->json();
            $latest   = $versions[0] ?? '15.1.1';
            $data     = Http::get("{$this->ddragonUrl}/cdn/{$latest}/data/en_US/champion.json")->json();

            $byId = [];
            foreach (($data['data'] ?? []) as $champ) {
                $id = (int)($champ['key'] ?? 0);
                if ($id > 0) $byId[$id] = $champ['id'] ?? null; // 'id' is the CamelCase name (Aatrox, MissFortune)
            }
            return $byId;
        });
    }

    /**
     * Top-N champion masteries by mastery points, enriched with championName.
     */
    public function getChampionMasteryByPUUID(string $puuid, int $count = 5): array
    {
        $count   = max(1, min(20, $count));
        $entries = $this->request(
            "{$this->baseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/{$puuid}/top?count={$count}"
        );

        $byId = $this->getChampionsById();
        $out  = [];
        foreach ($entries as $entry) {
            $cid = (int)($entry['championId'] ?? 0);
            $out[] = [
                'championId'    => $cid,
                'championName'  => $byId[$cid] ?? null,
                'championLevel' => $entry['championLevel'] ?? 0,
                'championPoints' => $entry['championPoints'] ?? 0,
                'lastPlayTime'  => $entry['lastPlayTime'] ?? null,
            ];
        }
        return $out;
    }

    /**
     * Fetches recent matches with the info that the profile UI needs.
     * Defaults to Flex queue (440) since that's what the panel surfaces.
     */
    public function getRecentMatches(string $puuid, int $count = 10, ?int $queue = 440): array
    {
        $matchIds = $this->getMatchIdsByPUUID($puuid, $count, $queue);
        $matches  = [];

        foreach ($matchIds as $matchId) {
            try {
                $detail = $this->getMatchDetail($matchId);
            } catch (Exception) {
                continue;
            }

            $info        = $detail['info']        ?? [];
            $participant = collect($info['participants'] ?? [])
                ->firstWhere('puuid', $puuid);

            if (!$participant) continue;

            $matches[] = [
                'matchId'      => $matchId,
                'gameStart'    => $info['gameStartTimestamp'] ?? null,
                'gameDuration' => $info['gameDuration']       ?? null,
                'queueId'      => $info['queueId']            ?? null,
                'win'          => (bool)($participant['win'] ?? false),
                'champion'     => $participant['championName'] ?? null,
                'championId'   => $participant['championId']   ?? null,
                'kills'        => $participant['kills']        ?? 0,
                'deaths'       => $participant['deaths']       ?? 0,
                'assists'      => $participant['assists']      ?? 0,
                'cs'           => ($participant['totalMinionsKilled'] ?? 0) +
                                  ($participant['neutralMinionsKilled'] ?? 0),
                'position'     => $participant['teamPosition'] ?? $participant['individualPosition'] ?? null,
            ];
        }

        return $matches;
    }

    /**
     * Single entry-point: given a Riot ID, fetches everything the profile UI
     * needs. Returns a structured payload (no caching here — the caller decides).
     */
    public function getFullProfileByRiotId(string $gameName, string $tagLine): array
    {
        $account  = $this->getPlayerPUUIDByRiotId($gameName, $tagLine);
        $puuid    = $account['puuid'] ?? null;

        if (!$puuid) {
            throw new Exception('PUUID não encontrado para essa Riot ID.');
        }

        return [
            'account'   => $account,
            'rank'      => $this->getPlayerDataByPUUID($puuid),
            'summoner'  => $this->getSummonerByPUUID($puuid),
            'matches'   => $this->getRecentMatches($puuid, 25),
            'masteries' => $this->getChampionMasteryByPUUID($puuid, 5),
        ];
    }
}

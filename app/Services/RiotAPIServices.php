<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class RiotAPIServices
{
    protected $apiKey;
    protected string $baseUrl = 'https://br1.api.riotgames.com';
    protected string $americasBaseUrl = 'https://americas.api.riotgames.com';

    public function __construct()
    {
        $this->apiKey = env('RIOT_API_KEY');
    }

    public function getPlayerPUUIDByRiotId(string $gameName, string $tagLine)
    {
        $response = Http::withHeader('X-Riot-Token', $this->apiKey)
            ->get("{$this->americasBaseUrl}/riot/account/v1/accounts/by-riot-id/{$gameName}/{$tagLine}");

        if ($response->failed()) {
            throw new Exception('Erro ao buscar dados na Riot: ' . $response->status());
        }

        $riotData = $response->json();

        return [
            'puuid' => $riotData['puuid'] ?? null,
        ];
    }

    public function getPlayerDataByPUUID(string $puuid)
    {
        $response = Http::withHeader('X-Riot-Token', $this->apiKey)
            ->get("{$this->baseUrl}/lol/league/v4/entries/by-puuid/{$puuid}");

        if ($response->failed()) {
            throw new Exception('Erro ao buscar dados na Riot: ' . $response->status());
        }

        $rankData = $response->json();

        return [
            'rank' => $rankData[0]['tier'] ?? 'Unranked',
            'league_points' => $rankData[0]['leaguePoints'] ?? 0,
        ];
    }

    public function getPlayerMatchesByPUUID(string $puuid)
    {
        $response = Http::withHeader('X-Riot-Token', $this->apiKey)
            ->get("{$this->americasBaseUrl}/lol/match/v5/matches/by-puuid/{$puuid}/ids");

        if ($response->failed()) {
            throw new Exception('Erro ao buscar dados na Riot: ' . $response->status());
        }

        return $response->json();
    }

    // public function registrarContaBaderneiro(string $gameName, string $tagLine)
    // {
    //     $playerPuuid = $this->getPlayerPUUIDByRiotId($gameName, $tagLine);

    //     $accountData = $this->getPlayerDataByPUUID($playerPuuid['puuid'] ?? '');

    //     $matchesData = $this->getPlayerMatchesByPUUID($playerPuuid['puuid'] ?? '');

    //     dd($accountData, $matchesData);

    //     $contaLoL = ContasLoL::create(
    //         [
    //             'summoner_name' => $gameName,
    //             'tagLine' => $tagLine,
    //             'puuid' => $playerPuuid['puuid'] ?? null,
    //             'elo' => $accountData['tier'] . ' ' . $accountData['rank'] ?? 'Unranked',
    //             'league_points' => $accountData['leaguePoints'] ?? 0,
    //             'wins' => $accountData['wins'] ?? 0,
    //             'losses' => $accountData['losses'] ?? 0,
    //             'user_id' => null,
    //         ]
    //     );
    // }

    public function getSummonerDataByPuuid(string $puuid)
    {

    }

    public function getRecentMatches(string $puuid)
    {
        return $this->getPlayerMatchesByPUUID($puuid);
    }
}

?>

<?php

namespace App\Http\Controllers;

use App\Models\ContasLoL;
use App\Services\RiotAPIServices;
use Exception;
use Illuminate\Http\Request;

class ContasLoLController extends Controller
{

    protected RiotApiServices $riotService;

    public function __construct(RiotApiServices $riotService)
    {
        $this->riotService = $riotService;
    }

    public function index()
    {
        //
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'summoner_name' => 'required|string|max:255',
            'tagLine' => 'required|string|max:255',
            'puuid' => 'required|string|max:255',
            'rank' => 'required|string|max:255',
            'league_points' => 'required|integer',
            'profile_icon_id' => 'required|string|max:255',
            'user_id' => 'required|integer',
        ]);

        $playerData = $this->riotService->getPlayerPUUIDByRiotId($gameName, $tagLine);

        $contaLoL = ContasLoL::create($validated);

        return response()->json([
            'message' => 'Conta LoL registrada com sucesso',
            'contaLoL' => $contaLoL
        ], 201);
    }

    public function show(string $gameName, string $tagLine)
    {
        try {
            $playerData = $this->riotService->getPlayerPUUIDByRiotId($gameName, $tagLine);

            return response()->json($playerData, 200);

        } catch (Exception $e) {

            return response()->json(['error' => 'Erro ao buscar dados na Riot: ' . $e->getMessage()], 404);
        }
    }

    public function edit(ContasLoL $contasLoL)
    {
        //
    }

    public function update(Request $request, ContasLoL $contasLoL)
    {
        //
    }

    public function destroy(ContasLoL $contasLoL)
    {
        //
    }

    public function testePuxarPuuId(string $gameName, string $tagLine)
    {
        try {
            $playerData = $this->riotService->registrarContaBaderneiro($gameName, $tagLine);

            return response()->json($playerData, 200);

        } catch (Exception $e) {

            return response()->json(['error' => 'Erro ao buscar dados na Riot: ' . $e->getMessage()], 404);
        }
    }
}

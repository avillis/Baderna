<?php

namespace App\Http\Controllers;

use App\Models\Baderneiros;
use App\Services\RiotAPIServices;
use Exception;
use Illuminate\Http\Request;

class BaderneirosController extends Controller
{
    protected RiotApiServices $riotService;

    public function index()
    {
        $baderneiros = Baderneiros::all();
        return response()->json($baderneiros, 200);
    }

    public function create()
    {

    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:baderneiros',
            'password' => 'required|string|min:8',
            'summoner_name' => 'required|string|max:255|unique:baderneiros',
            'tagLine' => 'required|string|max:255',
            'puuid' => 'required|string|max:255',
            'rank' => 'required|string|max:255',
            'league_points' => 'required|integer',
            'profile_icon_id' => 'required|string|max:255',
            'user_id' => 'required|integer',
            ]);

        $baderneiro = Baderneiros::create($validated);

        return response()->json([
            'message' => 'Baderneiro created successfully',
            'baderneiro' => $baderneiro
        ], 201);
    }

    public function show(Baderneiros $baderneiros)
    {

    }

    public function edit(Baderneiros $baderneiros)
    {

    }

    public function update(Request $request, Baderneiros $baderneiros)
    {

    }

    public function destroy(Baderneiros $baderneiros)
    {

    }
}

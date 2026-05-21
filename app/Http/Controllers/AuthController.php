<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Services\RiotAPIServices;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return response()->json([
                'message' => 'Login realizado com sucesso',
                'user' => Auth::user()
            ]);
        }

        return response()->json([
            'message' => 'Credenciais inválidas'
            ], 401);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();


        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado'
        ]);
    }

    public function register(Request $request, RiotAPIService $riotService)
    {
        $validatedData = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'summoner_name' => ['required', 'string'],
            'tag_line' => ['required', 'string'],
        ]);

        $riotAccount = $riotService->getPlayerPUUIDByRiotId(
            $validatedData['summoner_name'],
            $validatedData['tag_line']
        );

        if (!$riotAccount || !isset($riotAccount['puuid'])) {
            throw ValidationException::withMessages([
                'summoner_name' => ['Não foi possível encontrar a conta Riot com o nome de invocador e tag fornecidos.'],
            ]);
        }

        $user = User::create([
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'summoner_name' => $riotAccount['summoner_name'],
            'tagLine' => $riotAccount['tag_line'],
            'riot_puuid' => $riotAccount['puuid'],
        ]);

        Auth::login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Conta criada com sucesso!',
            'user' => $user
        ], 201);
    }
}

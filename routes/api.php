<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BaderneirosController;
use App\Http\Controllers\ContasLoLController;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $token = $user->tokens()->delete();
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'message' => 'Login realizado.',
        'token' => $token
    ]);
});

// Route::get('/baderneiros', [BaderneirosController::class, 'index']);

Route::apiResource('baderneiros', BaderneirosController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/contas-lol/{gameName}/{tagLine}', [ContasLoLController::class, 'testePuxarPuuId']);
});


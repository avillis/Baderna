<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Http\Api\ProfileController;
use App\Http\Api\PostController;
use App\Http\Api\CommentController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// @TODO ROTA PARA TESTES, APAGAR DEPOIS!!!
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

Route::middleware('auth:sanctum')->group(function () {

    // Feed (Posts)
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);

    // Perfil (Profile)
    Route::get('/users/{user}', [ProfileController::class, 'show']);

    // Comentários (Polimórficos)
    Route::post('/{type}/{id}/comments', [CommentController::class, 'store'])
        ->whereIn('type', ['posts', 'users']);
});


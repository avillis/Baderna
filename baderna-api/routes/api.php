<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\AvatarUploadController;
use App\Http\Controllers\Api\InhousesController;
use App\Http\Controllers\Api\MemberCoinsController;
use App\Http\Controllers\Api\MemberCommentsController;
use App\Http\Controllers\Api\MemberRanksController;
use App\Http\Controllers\Api\MembersController;
use App\Http\Controllers\Api\MemberUnlocksController;
use App\Http\Controllers\Api\RiotProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TitlesController;

// ── Auth ───────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Públicos ───────────────────────────────────────────────────────────
Route::get(
    '/riot-profile/{gameName}/{tagLine}',
    [RiotProfileController::class, 'show']
)->where('tagLine', '[A-Za-z0-9]+');

// Configs públicas (todos os usuários precisam ler os valores correntes).
Route::get('/coin-rewards', [AppSettingsController::class, 'showCoinRewards']);
Route::get('/inhouse-points', [AppSettingsController::class, 'showInhousePoints']);
Route::get('/titles', [TitlesController::class, 'index']);
Route::get('/members', [MembersController::class, 'index']);
Route::get('/members/ranks', [MemberRanksController::class, 'index']);
Route::get('/members/{slug}/comments', [MemberCommentsController::class, 'index']);
Route::get('/inhouses', [InhousesController::class, 'index']);
Route::get('/inhouses/{shortCode}', [InhousesController::class, 'show']);

// Admin (sem auth em dev — adicionar middleware quando subir).
Route::get('/admin/riot-key', [SettingsController::class, 'showRiotKey']);
Route::put('/admin/riot-key', [SettingsController::class, 'updateRiotKey']);

// ── Autenticados ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Feed (Posts)
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/image', [PostController::class, 'uploadImage']);

    // Perfil (Profile)
    Route::get('/users/{user}', [ProfileController::class, 'show']);

    // Comentários polimórficos
    Route::post('/{type}/{id}/comments', [CommentController::class, 'store'])
        ->whereIn('type', ['posts', 'users']);

    // Account (Minha Conta)
    Route::get('/account', [AccountController::class, 'show']);
    Route::put('/account', [AccountController::class, 'update']);
    Route::post('/account/avatar', [AvatarUploadController::class, 'store']);

    // Saldo do próprio usuário + unlocks
    Route::get('/account/coins', [MemberCoinsController::class, 'me']);
    Route::post('/account/coins/adjust', [MemberCoinsController::class, 'adjust']);
    Route::get('/account/unlocks', [MemberUnlocksController::class, 'index']);
    Route::post('/account/unlocks', [MemberUnlocksController::class, 'store']);

    // Comentários nos perfis
    Route::post('/members/{slug}/comments', [MemberCommentsController::class, 'store']);
    Route::delete('/members/{slug}/comments/{commentId}', [MemberCommentsController::class, 'destroy']);

    // Inhouses (criar/atualizar/apagar — listar é público)
    Route::post('/inhouses', [InhousesController::class, 'store']);
    Route::patch('/inhouses/{shortCode}', [InhousesController::class, 'update']);
    Route::delete('/inhouses/{shortCode}', [InhousesController::class, 'destroy']);

    // Admin-only — só rolam com Sanctum válido + is_admin=true
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::put('/coin-rewards', [AppSettingsController::class, 'updateCoinRewards']);
        Route::put('/inhouse-points', [AppSettingsController::class, 'updateInhousePoints']);
        Route::post('/titles', [TitlesController::class, 'store']);
        Route::delete('/titles/{slug}', [TitlesController::class, 'destroy']);
        Route::get('/member-coins', [MemberCoinsController::class, 'index']);
        Route::put('/member-coins/{user}', [MemberCoinsController::class, 'update']);
        Route::get('/member-unlocks/{user}', [MemberUnlocksController::class, 'adminIndex']);
        Route::post('/member-unlocks/{user}', [MemberUnlocksController::class, 'adminGrant']);
        Route::delete('/member-unlocks/{user}/{kind}/{slug}', [MemberUnlocksController::class, 'adminRevoke']);
        Route::post('/members', [MembersController::class, 'adminStore']);
        Route::delete('/members/{user}', [MembersController::class, 'softDelete']);
        Route::post('/members/{user}/restore', [MembersController::class, 'restore']);
        Route::put('/members/{user}/role', [MembersController::class, 'setRole']);
    });
});

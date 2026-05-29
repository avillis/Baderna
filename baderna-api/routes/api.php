<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\PostCommentsController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\AvatarUploadController;
use App\Http\Controllers\Api\BadernaPointsLogController;
use App\Http\Controllers\Api\EmailTemplatesController;
use App\Http\Controllers\Api\ErrorLogsController;
use App\Http\Controllers\Api\InhousesController;
use App\Http\Controllers\Api\MemberCoinsController;
use App\Http\Controllers\Api\MemberCommentsController;
use App\Http\Controllers\Api\MemberRanksController;
use App\Http\Controllers\Api\MemberWinratesController;
use App\Http\Controllers\Api\MembersController;
use App\Http\Controllers\Api\MemberUnlocksController;
use App\Http\Controllers\Api\RiotProfileController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\NotificationsController;
use App\Http\Controllers\Api\PostReactionsController;
use App\Http\Controllers\Api\TitlesController;
use App\Http\Controllers\Api\BirthdaysController;
use App\Http\Controllers\Api\SpotifyController;
use App\Http\Controllers\Api\LastFmController;
use App\Http\Controllers\Api\PostBookmarksController;
use App\Http\Controllers\Api\PostPinController;
use App\Http\Controllers\Api\PostPollController;
use App\Http\Controllers\Api\LinkPreviewController;

// ── Spotify callback (sem auth — recupera user pelo state criptografado) ──
Route::get('/spotify/callback', [SpotifyController::class, 'callback']);
// Perfil Spotify público — sem auth, qualquer visitante pode ver
Route::get('/spotify/user/{slug}', [SpotifyController::class, 'forUser']);

// ── Last.fm público — sem auth ──
Route::get('/lastfm/feed', [LastFmController::class, 'feed']);
Route::get('/lastfm/user/{slug}', [LastFmController::class, 'forUser']);

// ── Públicas (auth) ────────────────────────────────────────────────────
// Únicas rotas SEM auth: register e login (não tem como ter token antes).
// Rate limit pra defender de brute-force / spam: 10 tentativas/min por IP.
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    // Recuperação de senha — públicas, com rate limit anti-spam.
    Route::post('/password/forgot', [PasswordResetController::class, 'forgot']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);
});

// ── Autenticados ───────────────────────────────────────────────────────
// TUDO o resto exige Sanctum válido. Nenhum dado da comunidade vaza pra
// anônimos (lista de membros, ranks, inhouses, posts, comentários, etc).
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Lookup Riot (usado dentro do app pra perfis de membros)
    Route::get(
        '/riot-profile/{gameName}/{tagLine}',
        [RiotProfileController::class, 'show']
    )->where('tagLine', '[A-Za-z0-9]+');

    // App settings públicos pra qualquer logado
    Route::get('/coin-rewards', [AppSettingsController::class, 'showCoinRewards']);
    Route::get('/inhouse-points', [AppSettingsController::class, 'showInhousePoints']);
    Route::get('/profile-loading-overlay', [AppSettingsController::class, 'showProfileLoadingOverlay']);
    Route::get('/store-prices', [AppSettingsController::class, 'showStorePrices']);
    Route::get('/titles', [TitlesController::class, 'index']);
    Route::get('/birthdays', [BirthdaysController::class, 'index']);

    // Spotify OAuth + dados (mantido para compatibilidade)
    Route::get('/spotify/redirect', [SpotifyController::class, 'redirect']);
    Route::delete('/spotify/disconnect', [SpotifyController::class, 'disconnect']);
    Route::get('/spotify/me', [SpotifyController::class, 'me']);

    // Last.fm — autenticados
    Route::get('/lastfm/me', [LastFmController::class, 'me']);
    Route::post('/lastfm/username', [LastFmController::class, 'updateUsername']);

    // Listagens da comunidade
    Route::get('/members', [MembersController::class, 'index']);
    Route::get('/members/ranks', [MemberRanksController::class, 'index']);
    Route::get('/members/{slug}/comments', [MemberCommentsController::class, 'index']);
    Route::get('/inhouses', [InhousesController::class, 'index']);
    Route::get('/inhouses/{shortCode}', [InhousesController::class, 'show']);

    // Feed (Posts)
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{idOrCode}', [PostController::class, 'show'])
        ->where('idOrCode', '[A-Za-z0-9]+');
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/image', [PostController::class, 'uploadImage']);
    Route::post('/posts/video', [PostController::class, 'uploadVideo']);

    // Frontend pode reportar erros JS (window.onerror) aqui — autenticado.
    Route::post('/error-logs', [ErrorLogsController::class, 'store']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::post('/posts/{id}/like', [PostController::class, 'toggleLike'])->whereNumber('id');
    // Reportar — throttle:3,60 = 3 reports por hora por user, defensiva contra abuso.
    Route::post('/posts/{id}/report', [PostController::class, 'report'])
        ->whereNumber('id')
        ->middleware('throttle:3,60');

    // Reações por emoji
    Route::get('/posts/{id}/reactions', [PostReactionsController::class, 'show'])->whereNumber('id');
    Route::post('/posts/{id}/reactions', [PostReactionsController::class, 'toggle'])->whereNumber('id');

    // Bookmarks
    Route::post('/posts/{id}/bookmark', [PostBookmarksController::class, 'toggle'])->whereNumber('id');

    // Enquete (poll) — votar/desvotar numa opção
    Route::post('/posts/{id}/poll/vote', [PostPollController::class, 'vote'])->whereNumber('id');

    // Pin no perfil
    Route::post('/posts/{id}/pin', [PostPinController::class, 'toggle'])->whereNumber('id');
    Route::get('/bookmarks', [PostBookmarksController::class, 'index']);

    // Link preview
    Route::get('/link-preview', [LinkPreviewController::class, 'show']);

    // Notificações
    Route::get('/notifications', [NotificationsController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationsController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationsController::class, 'destroy']);

    // Comentários em posts (mesma shape do MemberCommentsController)
    Route::get('/posts/{id}/comments', [PostCommentsController::class, 'index'])->whereNumber('id');
    Route::post('/posts/{id}/comments', [PostCommentsController::class, 'store'])->whereNumber('id');
    Route::delete('/posts/{id}/comments/{commentId}', [PostCommentsController::class, 'destroy'])->whereNumber('id');
    Route::post('/posts/{id}/comments/{commentId}/like', [PostCommentsController::class, 'toggleLike'])->whereNumber('id');

    // Perfil (Profile)
    Route::get('/users/{user}', [ProfileController::class, 'show']);

    // Comentários polimórficos
    Route::post('/{type}/{id}/comments', [CommentController::class, 'store'])
        ->whereIn('type', ['posts', 'users']);

    // Account (Minha Conta)
    Route::get('/account', [AccountController::class, 'show']);
    Route::put('/account', [AccountController::class, 'update']);
    Route::put('/account/password', [AccountController::class, 'updatePassword'])
        ->middleware('throttle:6,1');
    Route::post('/account/avatar', [AvatarUploadController::class, 'store']);

    // Saldo do próprio usuário + unlocks
    Route::get('/account/coins', [MemberCoinsController::class, 'me']);
    Route::get('/account/winrates-with-members', [MemberWinratesController::class, 'index']);
    Route::post('/account/winrates-with-members/refresh', [MemberWinratesController::class, 'refresh']);
    // Mesma feature, mas pra um member específico (perfil de terceiros).
    Route::get('/members/{user}/winrates-with-members', [MemberWinratesController::class, 'showForMember'])
        ->whereNumber('user');
    Route::post('/members/{user}/winrates-with-members/refresh', [MemberWinratesController::class, 'refreshForMember'])
        ->whereNumber('user');
    // ATENÇÃO: /account/coins/adjust foi REMOVIDA — permitia self-credit
    // ilimitado. Débito agora é feito atomicamente dentro do unlocks/store.
    Route::get('/account/unlocks', [MemberUnlocksController::class, 'index']);
    Route::post('/account/unlocks', [MemberUnlocksController::class, 'store']);

    // Comentários nos perfis
    Route::post('/members/{slug}/comments', [MemberCommentsController::class, 'store']);
    Route::delete('/members/{slug}/comments/{commentId}', [MemberCommentsController::class, 'destroy']);

    // Inhouses (criar/atualizar/apagar)
    Route::post('/inhouses', [InhousesController::class, 'store']);
    Route::patch('/inhouses/{shortCode}', [InhousesController::class, 'update']);
    Route::post('/inhouses/{shortCode}/winner', [InhousesController::class, 'setWinner']);
    Route::delete('/inhouses/{shortCode}', [InhousesController::class, 'destroy']);

    // Admin-only — só rolam com Sanctum válido + is_admin=true
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/riot-key', [SettingsController::class, 'showRiotKey']);
        Route::put('/riot-key', [SettingsController::class, 'updateRiotKey']);
        Route::put('/coin-rewards', [AppSettingsController::class, 'updateCoinRewards']);
        Route::put('/inhouse-points', [AppSettingsController::class, 'updateInhousePoints']);
        Route::put('/profile-loading-overlay', [AppSettingsController::class, 'updateProfileLoadingOverlay']);
        Route::put('/store-prices', [AppSettingsController::class, 'updateStorePrices']);
        Route::post('/sync-rules-discord', [AppSettingsController::class, 'syncRulesDiscord']);
        Route::post('/sync-ranking-discord', [AppSettingsController::class, 'syncRankingDiscord']);
        Route::post('/sync-birthdays-discord', [AppSettingsController::class, 'syncBirthdaysDiscord']);
        Route::post('/titles', [TitlesController::class, 'store']);
        Route::delete('/titles/{slug}', [TitlesController::class, 'destroy']);
        Route::get('/bp-log', [BadernaPointsLogController::class, 'index']);
        Route::get('/member-coins', [MemberCoinsController::class, 'index']);
        Route::put('/member-coins/{user}', [MemberCoinsController::class, 'update']);
        Route::post('/flex-credit', [MemberCoinsController::class, 'flexCreditBatch']);
        Route::get('/member-unlocks/{user}', [MemberUnlocksController::class, 'adminIndex']);
        Route::post('/member-unlocks/{user}', [MemberUnlocksController::class, 'adminGrant']);
        Route::delete('/member-unlocks/{user}/{kind}/{slug}', [MemberUnlocksController::class, 'adminRevoke']);
        Route::post('/members', [MembersController::class, 'adminStore']);
        // Aprovação de cadastros (pendentes/rejeitados)
        Route::get('/members/pending', [MembersController::class, 'pending']);
        Route::post('/members/{user}/approve', [MembersController::class, 'approve']);
        Route::post('/members/{user}/reject', [MembersController::class, 'reject']);
        Route::delete('/members/{user}', [MembersController::class, 'softDelete']);
        Route::post('/members/{user}/restore', [MembersController::class, 'restore']);
        Route::put('/members/{user}/role', [MembersController::class, 'setRole']);
        // Email templates — catálogo, preview e envio de teste
        Route::get('/emails', [EmailTemplatesController::class, 'index']);
        Route::get('/emails/{id}/preview', [EmailTemplatesController::class, 'preview']);
        Route::post('/emails/{id}/test', [EmailTemplatesController::class, 'sendTest']);

        Route::get('/error-logs', [ErrorLogsController::class, 'index']);
        Route::delete('/error-logs/all', [ErrorLogsController::class, 'destroyAll']);
        Route::delete('/error-logs/{id}', [ErrorLogsController::class, 'destroy'])->whereNumber('id');
    });
});

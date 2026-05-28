<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class SpotifyController extends Controller
{
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    public function __construct()
    {
        $this->clientId     = config('services.spotify.client_id');
        $this->clientSecret = config('services.spotify.client_secret');
        $this->redirectUri  = config('services.spotify.redirect_uri');
    }

    /**
     * Gera a URL de autorização do Spotify e retorna pro frontend redirecionar.
     * Requer auth:sanctum — o user ID é codificado criptografado no state.
     */
    public function redirect(Request $request): JsonResponse
    {
        $user  = $request->user();
        $state = Crypt::encryptString((string) $user->id);

        $scopes = implode(' ', [
            'user-read-private',
            'user-top-read',
            'user-read-recently-played',
        ]);

        $url = 'https://accounts.spotify.com/authorize?' . http_build_query([
            'response_type' => 'code',
            'client_id'     => $this->clientId,
            'scope'         => $scopes,
            'redirect_uri'  => $this->redirectUri,
            'state'         => $state,
            'show_dialog'   => 'false',
        ]);

        return response()->json(['url' => $url]);
    }

    /**
     * Spotify redireciona aqui após o usuário autorizar.
     * Sem auth middleware — recupera o user pelo state criptografado.
     */
    public function callback(Request $request)
    {
        $code  = $request->query('code');
        $state = $request->query('state');
        $error = $request->query('error');

        $frontend = rtrim(config('app.frontend_url', 'https://bdrn.com.br'), '/');

        if ($error || !$code || !$state) {
            return redirect($frontend . '/minha-conta?spotify=error');
        }

        // Decripta o state para recuperar o user ID
        try {
            $userId = Crypt::decryptString($state);
            $user   = User::findOrFail((int) $userId);
        } catch (\Throwable) {
            return redirect($frontend . '/minha-conta?spotify=error');
        }

        // Troca o code pelos tokens
        $response = Http::asForm()
            ->withBasicAuth($this->clientId, $this->clientSecret)
            ->post('https://accounts.spotify.com/api/token', [
                'grant_type'   => 'authorization_code',
                'code'         => $code,
                'redirect_uri' => $this->redirectUri,
            ]);

        if (!$response->successful()) {
            return redirect($frontend . '/minha-conta?spotify=error');
        }

        $data = $response->json();

        $user->spotify_access_token     = $data['access_token'];
        $user->spotify_refresh_token    = $data['refresh_token'] ?? $user->spotify_refresh_token;
        $user->spotify_token_expires_at = now()->addSeconds(($data['expires_in'] ?? 3600) - 60);
        $user->save();

        return redirect($frontend . '/minha-conta?spotify=connected');
    }

    /**
     * Desconecta o Spotify — apaga os tokens armazenados.
     */
    public function disconnect(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->spotify_access_token     = null;
        $user->spotify_refresh_token    = null;
        $user->spotify_token_expires_at = null;
        $user->save();

        return response()->json(['ok' => true]);
    }

    /**
     * Retorna os dados Spotify do usuário autenticado (top tracks + recent).
     */
    public function me(Request $request): JsonResponse
    {
        $user  = $request->user();
        $token = $this->freshToken($user);

        if (!$token) {
            return response()->json(['connected' => false]);
        }

        [$topTracks, $topTracksRange] = $this->fetchTopTracks($token);
        return response()->json([
            'connected'       => true,
            'topTracks'       => $topTracks,
            'topTracksRange'  => $topTracksRange,
            'recentlyPlayed'  => $this->fetchRecentlyPlayed($token),
        ]);
    }

    /**
     * Retorna dados Spotify de um membro pelo slug (perfil público).
     */
    public function forUser(string $slug): JsonResponse
    {
        $user = User::where('slug', $slug)
            ->where('is_deleted', false)
            ->first();

        if (!$user) {
            return response()->json(['connected' => false]);
        }

        $token = $this->freshToken($user);

        if (!$token) {
            return response()->json(['connected' => false]);
        }

        [$topTracks, $topTracksRange] = $this->fetchTopTracks($token);
        return response()->json([
            'connected'       => true,
            'topTracks'       => $topTracks,
            'topTracksRange'  => $topTracksRange,
            'recentlyPlayed'  => $this->fetchRecentlyPlayed($token),
        ]);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function freshToken(User $user): ?string
    {
        if (!$user->spotify_access_token) return null;

        // Trata expires_at null como expirado para forçar o refresh na primeira chamada
        // após a migration (evita usar token antigo inválido indefinidamente).
        $expired = !$user->spotify_token_expires_at || now()->gte($user->spotify_token_expires_at);

        if ($expired) {
            if (!$user->spotify_refresh_token) return null;
            if (!$this->refreshToken($user)) return null;
        }

        return $user->spotify_access_token;
    }

    private function refreshToken(User $user): bool
    {
        $response = Http::asForm()
            ->withBasicAuth($this->clientId, $this->clientSecret)
            ->post('https://accounts.spotify.com/api/token', [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $user->spotify_refresh_token,
            ]);

        if (!$response->successful()) return false;

        $data = $response->json();
        $user->spotify_access_token     = $data['access_token'];
        $user->spotify_token_expires_at = now()->addSeconds(($data['expires_in'] ?? 3600) - 60);
        if (!empty($data['refresh_token'])) {
            $user->spotify_refresh_token = $data['refresh_token'];
        }
        $user->save();
        return true;
    }

    /**
     * Retorna [items, range_label].
     * Tenta short_term (último mês) primeiro; se vazio, cai pra medium_term (6 meses).
     */
    private function fetchTopTracks(string $token): array
    {
        $ranges = [
            'short_term'  => 'short',
            'medium_term' => 'medium',
        ];

        foreach ($ranges as $range => $label) {
            $r = Http::withToken($token)
                ->get('https://api.spotify.com/v1/me/top/tracks', [
                    'limit'      => 5,
                    'time_range' => $range,
                ]);

            if (!$r->successful()) continue;

            $items = collect($r->json('items', []))->map(fn($t) => [
                'id'      => $t['id'],
                'name'    => $t['name'],
                'artist'  => collect($t['artists'])->pluck('name')->implode(', '),
                'album'   => $t['album']['name'] ?? null,
                'image'   => $t['album']['images'][0]['url'] ?? null,
                'url'     => $t['external_urls']['spotify'] ?? null,
                'preview' => $t['preview_url'] ?? null,
            ])->all();

            if (!empty($items)) return [$items, $label];
        }

        return [[], 'short'];
    }

    private function fetchRecentlyPlayed(string $token): array
    {
        $r = Http::withToken($token)
            ->get('https://api.spotify.com/v1/me/player/recently-played', [
                'limit' => 5,
            ]);

        if (!$r->successful()) return [];

        return collect($r->json('items', []))->map(fn($item) => [
            'id'       => $item['track']['id'],
            'name'     => $item['track']['name'],
            'artist'   => collect($item['track']['artists'])->pluck('name')->implode(', '),
            'album'    => $item['track']['album']['name'] ?? null,
            'image'    => $item['track']['album']['images'][0]['url'] ?? null,
            'url'      => $item['track']['external_urls']['spotify'] ?? null,
            'preview'  => $item['track']['preview_url'] ?? null,
            'playedAt' => $item['played_at'],
        ])->all();
    }
}

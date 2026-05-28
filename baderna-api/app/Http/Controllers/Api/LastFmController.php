<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LastFmController extends Controller
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.lastfm.api_key', '');
    }

    /** GET /lastfm/me — dados do usuário autenticado */
    public function me(Request $request): JsonResponse
    {
        return $this->dataForUser($request->user());
    }

    /** GET /lastfm/user/{slug} — dados públicos de um membro */
    public function forUser(string $slug): JsonResponse
    {
        $user = User::where('slug', $slug)->where('is_deleted', false)->first();
        if (!$user) return response()->json(['connected' => false]);
        return $this->dataForUser($user);
    }

    /** POST /lastfm/username — salva o username Last.fm do usuário autenticado */
    public function updateUsername(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['nullable', 'string', 'max:64', 'regex:/^[a-zA-Z0-9_-]+$/'],
        ]);

        $user = $request->user();
        $user->lastfm_username = $request->input('username') ?: null;
        $user->save();

        return $this->dataForUser($user);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function dataForUser(User $user): JsonResponse
    {
        if (!$user->lastfm_username) {
            return response()->json(['connected' => false]);
        }

        $username = $user->lastfm_username;

        [$topTracks, $topTracksRange] = $this->fetchTopTracks($username);
        $recentlyPlayed = $this->fetchRecentTracks($username);

        return response()->json([
            'connected'      => true,
            'username'       => $username,
            'topTracks'      => $topTracks,
            'topTracksRange' => $topTracksRange,
            'recentlyPlayed' => $recentlyPlayed,
        ]);
    }

    private function fetchTopTracks(string $username): array
    {
        $periods = ['1month' => 'short', '6month' => 'medium'];

        foreach ($periods as $period => $label) {
            $r = Http::get('https://ws.audioscrobbler.com/2.0/', [
                'method'  => 'user.getTopTracks',
                'user'    => $username,
                'api_key' => $this->apiKey,
                'format'  => 'json',
                'limit'   => 5,
                'period'  => $period,
            ]);

            if (!$r->successful()) continue;

            $items = $r->json('toptracks.track', []);
            if (!is_array($items)) continue;

            $tracks = collect($items)->map(fn($t) => [
                'id'      => md5(($t['name'] ?? '') . ($t['artist']['name'] ?? '')),
                'name'    => $t['name'] ?? '',
                'artist'  => $t['artist']['name'] ?? '',
                'album'   => null,
                'image'   => $this->bestImage($t['image'] ?? []),
                'url'     => $t['url'] ?? null,
                'preview' => null,
            ])->all();

            if (!empty($tracks)) return [$tracks, $label];
        }

        return [[], 'short'];
    }

    private function fetchRecentTracks(string $username): array
    {
        $r = Http::get('https://ws.audioscrobbler.com/2.0/', [
            'method'  => 'user.getRecentTracks',
            'user'    => $username,
            'api_key' => $this->apiKey,
            'format'  => 'json',
            'limit'   => 5,
        ]);

        if (!$r->successful()) return [];

        $items = $r->json('recenttracks.track', []);
        if (!is_array($items)) return [];

        return collect($items)->map(fn($t) => [
            'id'         => md5(($t['name'] ?? '') . ($t['artist']['#text'] ?? '')),
            'name'       => $t['name'] ?? '',
            'artist'     => $t['artist']['#text'] ?? '',
            'album'      => $t['album']['#text'] ?? null,
            'image'      => $this->bestImage($t['image'] ?? []),
            'url'        => $t['url'] ?? null,
            'preview'    => null,
            'nowPlaying' => isset($t['@attr']['nowplaying']),
        ])->all();
    }

    /** Retorna a melhor URL de imagem disponível, pulando o placeholder vazio do Last.fm. */
    private function bestImage(array $images): ?string
    {
        $emptyHash = '2a96cbd8b46e442fc41c2b86b821562f';
        $map = collect($images)->keyBy('size');

        foreach (['extralarge', 'large', 'medium', 'small'] as $size) {
            $url = $map[$size]['#text'] ?? null;
            if ($url && !str_contains($url, $emptyHash)) return $url;
        }

        return null;
    }
}

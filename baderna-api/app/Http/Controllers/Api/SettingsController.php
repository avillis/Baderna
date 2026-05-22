<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RiotAPIServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SettingsController extends Controller
{
    /**
     * Returns the currently-active Riot API key (masked) plus a healthcheck.
     */
    public function showRiotKey()
    {
        $key = Cache::get(RiotAPIServices::SETTINGS_KEY) ?? env('RIOT_API_KEY');
        $source = Cache::has(RiotAPIServices::SETTINGS_KEY) ? 'admin' : 'env';

        return response()->json([
            'masked' => $this->mask($key),
            'present' => !empty($key),
            'source' => $source,
            'healthy' => $this->pingRiot($key),
        ]);
    }

    /**
     * Saves a new Riot API key in the cache so it takes effect immediately
     * without restarting the server. Also pings Riot to confirm it works
     * and clears any cached profile responses so the next fetch is fresh.
     */
    public function updateRiotKey(Request $request)
    {
        $data = $request->validate([
            'key' => 'required|string|regex:/^RGAPI-[A-Za-z0-9-]+$/',
        ]);

        if (!$this->pingRiot($data['key'])) {
            return response()->json([
                'error' => 'A chave não passou no teste com a Riot. Confere se ela é válida.',
            ], 422);
        }

        Cache::forever(RiotAPIServices::SETTINGS_KEY, $data['key']);
        $this->clearProfileCache();

        return response()->json([
            'masked' => $this->mask($data['key']),
            'present' => true,
            'source' => 'admin',
            'healthy' => true,
        ]);
    }

    private function mask(?string $key): ?string
    {
        if (!$key) return null;
        $tail = substr($key, -4);
        return 'RGAPI-•••••••••••••••••••••••••••••••-' . $tail;
    }

    private function pingRiot(?string $key): bool
    {
        if (!$key) return false;
        // Endpoint barato e estável pra validar a chave.
        $response = Http::withHeader('X-Riot-Token', $key)
            ->get('https://br1.api.riotgames.com/lol/platform/v3/champion-rotations');
        return $response->successful();
    }

    private function clearProfileCache(): void
    {
        // Cache::tags(...) seria ideal mas requer driver compatível. Como
        // estamos no driver default (file), basta limpar tudo — é safe pra dev.
        Cache::flush();
    }
}

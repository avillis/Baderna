<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RiotAPIServices;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Exception;

class RiotProfileController extends Controller
{
    public function show(string $gameName, string $tagLine, RiotAPIServices $riotApi)
    {
        $cacheKey = 'riot_profile_' . strtolower($gameName . '#' . $tagLine);

        try {
            $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($riotApi, $gameName, $tagLine) {
                return $riotApi->getFullProfileByRiotId($gameName, $tagLine);
            });

            return response()->json($payload);
        } catch (Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 502);
        }
    }
}

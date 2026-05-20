<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\RiotAPIServices;

class ProfileController extends Controller
{
    public function show(User $user, RiotAPIServices $riotService)
    {
        $user->load([
            'profileComments.author:id.name',
            'posts' => function ($query) {
                $query->latest()->limit(5);
            }
        ]);

        $riotData = Cache::remember("riot_profile_{$user->riot_puuid}", 3600, function () use ($user, $riotService) {
            if (!$user->riot_puuid) return null;
            return $riotService->getPlayerDataByPUUID($user->riot_puuid);
        });

        return response()->json([
            'user' => $user,
            'riot_data' => $riotData,
        ]);
    }
}

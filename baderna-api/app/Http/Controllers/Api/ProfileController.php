<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Jobs\SyncRiotMatchHistory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
// use App\Services\RiotAPIServices;

class ProfileController extends Controller
{
    public function show(User $user)
    {
        $matchHistory = Cache::get("riot_matches_{$user->id}");
        $isUpdating = false;

        if (!$matchHistory) {
            SyncRiotMatchHistory::dispatch($user);
            $isUpdating = true;
        }

        return response()->json([
            'user' => $user->load(['posts', 'profileComments.author']),
            'matches' => $matchHistory ?: [],
            'is_updating' => $isUpdating,
        ]);
    }
}

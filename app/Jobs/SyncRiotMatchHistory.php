<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\User;
use App\Services\RiotAPIServices;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class SyncRiotMatchHistory implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function handle(RiotAPIServices $riotApi): void
    {
        if (!$this->user->riot_puuid) return;

        try {
            $matches = $riotService->getRecentMatches($this->user->riot_puuid);

            Cache::put("riot_matches_{$this->user->id}", $matches, now()->addHours(1));

        } catch (\Exception $e) {
            $this->release(60);
        }
    }
}

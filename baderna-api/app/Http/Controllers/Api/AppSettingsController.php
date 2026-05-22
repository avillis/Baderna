<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class AppSettingsController extends Controller
{
    private const COIN_REWARDS_KEY = 'coin_rewards';
    private const INHOUSE_POINTS_KEY = 'inhouse_points';

    private const COIN_REWARDS_DEFAULTS = [
        'flex'    => ['win' => 20, 'loss' => 10],
        'inhouse' => ['win' => 60, 'loss' => 20],
    ];

    private const INHOUSE_POINTS_DEFAULTS = [
        'flex'    => ['win' => 10, 'loss' => 5],
        'inhouse' => ['win' => 25, 'loss' => 15],
    ];

    public function showCoinRewards()
    {
        return response()->json(
            AppSetting::get(self::COIN_REWARDS_KEY, self::COIN_REWARDS_DEFAULTS)
        );
    }

    public function updateCoinRewards(Request $request)
    {
        $data = $request->validate([
            'flex.win'     => 'required|integer|min:0',
            'flex.loss'    => 'required|integer|min:0',
            'inhouse.win'  => 'required|integer|min:0',
            'inhouse.loss' => 'required|integer|min:0',
        ]);

        AppSetting::put(self::COIN_REWARDS_KEY, $data);
        return response()->json($data);
    }

    public function showInhousePoints()
    {
        return response()->json(
            AppSetting::get(self::INHOUSE_POINTS_KEY, self::INHOUSE_POINTS_DEFAULTS)
        );
    }

    public function updateInhousePoints(Request $request)
    {
        $data = $request->validate([
            'flex.win'     => 'required|integer|min:0',
            'flex.loss'    => 'required|integer|min:0',
            'inhouse.win'  => 'required|integer|min:0',
            'inhouse.loss' => 'required|integer|min:0',
        ]);

        AppSetting::put(self::INHOUSE_POINTS_KEY, $data);
        return response()->json($data);
    }
}

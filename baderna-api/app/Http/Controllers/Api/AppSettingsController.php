<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Services\BirthdayWebhook;
use App\Services\DiscordWebhook;
use App\Services\RankingWebhook;
use Illuminate\Http\Request;

class AppSettingsController extends Controller
{
    private const COIN_REWARDS_KEY = 'coin_rewards';
    private const INHOUSE_POINTS_KEY = 'inhouse_points';
    private const PROFILE_LOADING_OVERLAY_KEY = 'profile_loading_overlay';
    private const STORE_PRICES_KEY = 'store_prices';
    private const STORE_PRICES_DEFAULTS = [
        'capa'  => 10,
        'title' => 50,
        'name'  => 80,
    ];

    private const COIN_REWARDS_DEFAULTS = [
        'flex'    => ['win' => 20, 'loss' => 10],
        'inhouse' => ['win' => 60, 'loss' => 20],
    ];

    private const INHOUSE_POINTS_DEFAULTS = [
        'flex'    => ['win' => 10, 'loss' => 5],
        'inhouse' => ['win' => 25, 'loss' => 15],
    ];

    private const PROFILE_LOADING_OVERLAY_DEFAULTS = [
        'disabled' => false,
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
        // BP pode ser NEGATIVO (ao contrário de coin_rewards): perder uma Flex
        // pode tirar pontos do ranking interno. Bounds só pra sanidade.
        $data = $request->validate([
            'flex.win'     => 'required|integer|min:-1000|max:1000',
            'flex.loss'    => 'required|integer|min:-1000|max:1000',
            'inhouse.win'  => 'required|integer|min:-1000|max:1000',
            'inhouse.loss' => 'required|integer|min:-1000|max:1000',
        ]);

        AppSetting::put(self::INHOUSE_POINTS_KEY, $data);
        return response()->json($data);
    }

    public function showProfileLoadingOverlay()
    {
        return response()->json(
            AppSetting::get(
                self::PROFILE_LOADING_OVERLAY_KEY,
                self::PROFILE_LOADING_OVERLAY_DEFAULTS
            )
        );
    }

    public function updateProfileLoadingOverlay(Request $request)
    {
        $data = $request->validate([
            'disabled' => 'required|boolean',
        ]);

        AppSetting::put(self::PROFILE_LOADING_OVERLAY_KEY, $data);
        return response()->json($data);
    }

    public function showStorePrices()
    {
        return response()->json(
            AppSetting::get(self::STORE_PRICES_KEY, self::STORE_PRICES_DEFAULTS)
        );
    }

    public function updateStorePrices(Request $request)
    {
        $data = $request->validate([
            'capa'  => 'required|integer|min:0',
            'title' => 'required|integer|min:0',
            'name'  => 'required|integer|min:0',
        ]);
        AppSetting::put(self::STORE_PRICES_KEY, $data);
        return response()->json($data);
    }

    /**
     * Sincroniza as regras da Baderna pro canal #regras do Discord.
     * Posta nova mensagem ou edita a existente (idempotente).
     */
    public function syncRulesDiscord()
    {
        $ok = DiscordWebhook::syncRulesToChannel();
        if (! $ok) {
            return response()->json(['error' => 'Falha ao sincronizar. Verifique DISCORD_BOT_TOKEN e DISCORD_RULES_CHANNEL_ID.'], 500);
        }
        return response()->json(['ok' => true]);
    }

    public function syncRankingDiscord()
    {
        $ok = RankingWebhook::postOrUpdate();
        if (! $ok) {
            return response()->json(['error' => 'Falha ao sincronizar o ranking.'], 500);
        }
        return response()->json(['ok' => true]);
    }

    public function syncBirthdaysDiscord()
    {
        $ok = BirthdayWebhook::postOrUpdate();
        if (! $ok) {
            return response()->json(['error' => 'Falha ao sincronizar aniversários. Verifique DISCORD_BOT_TOKEN e DISCORD_BIRTHDAYS_CHANNEL_ID.'], 500);
        }
        return response()->json(['ok' => true]);
    }
}

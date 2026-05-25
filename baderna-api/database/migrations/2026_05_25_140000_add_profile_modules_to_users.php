<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('community_highlight', 160)->nullable()->after('secondary_lane');
            $table->string('duo_label', 120)->nullable()->after('community_highlight');
            $table->json('profile_module_order')->nullable()->after('duo_label');
            $table->json('favorite_champion_slugs')->nullable()->after('profile_module_order');
            $table->string('favorite_game_title', 120)->nullable()->after('favorite_champion_slugs');
            $table->string('favorite_game_cover_url')->nullable()->after('favorite_game_title');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'community_highlight',
                'duo_label',
                'profile_module_order',
                'favorite_champion_slugs',
                'favorite_game_title',
                'favorite_game_cover_url',
            ]);
        });
    }
};

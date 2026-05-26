<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Destaque dado por admin pelo painel (ex: "rei do inhouse").
            $table->string('community_highlight', 160)->nullable()->after('secondary_lane');
            // Ordem dos cards modulares escolhida pelo próprio usuário no
            // seletor do perfil. Null = ordem default.
            $table->json('profile_module_order')->nullable()->after('community_highlight');
            // Top 3 champs favoritos escolhidos à mão (não derivados do histórico).
            $table->json('favorite_champion_slugs')->nullable()->after('profile_module_order');
            // Jogo favorito multi-game: nome + capa puxados de catálogo externo
            // (RAWG, etc) e cacheados aqui.
            $table->string('favorite_game_title', 120)->nullable()->after('favorite_champion_slugs');
            $table->string('favorite_game_cover_url')->nullable()->after('favorite_game_title');
            // Amizade/duo destacada: aponta pra outro user da Baderna.
            $table->unsignedBigInteger('duo_user_id')->nullable()->after('favorite_game_cover_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'community_highlight',
                'profile_module_order',
                'favorite_champion_slugs',
                'favorite_game_title',
                'favorite_game_cover_url',
                'duo_user_id',
            ]);
        });
    }
};

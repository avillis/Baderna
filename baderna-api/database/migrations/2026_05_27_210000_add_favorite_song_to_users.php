<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('favorite_song_spotify_id', 64)->nullable()->after('spotify_token_expires_at');
            $table->string('favorite_song_name', 255)->nullable()->after('favorite_song_spotify_id');
            $table->string('favorite_song_artist', 255)->nullable()->after('favorite_song_name');
            $table->string('favorite_song_image', 255)->nullable()->after('favorite_song_artist');
            $table->string('favorite_song_url', 255)->nullable()->after('favorite_song_image');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'favorite_song_spotify_id',
                'favorite_song_name',
                'favorite_song_artist',
                'favorite_song_image',
                'favorite_song_url',
            ]);
        });
    }
};

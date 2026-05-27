<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('spotify_access_token')->nullable()->after('birthday_hidden');
            $table->text('spotify_refresh_token')->nullable()->after('spotify_access_token');
            $table->timestamp('spotify_token_expires_at')->nullable()->after('spotify_refresh_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'spotify_access_token',
                'spotify_refresh_token',
                'spotify_token_expires_at',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove duplicatas antes de adicionar o unique (mantém o de menor id).
        DB::statement('
            DELETE r1 FROM post_reactions r1
            INNER JOIN post_reactions r2
            WHERE r1.id > r2.id
              AND r1.user_id = r2.user_id
              AND r1.post_id = r2.post_id
              AND r1.emoji   = r2.emoji
        ');

        // Adiciona o unique só se ainda não existe.
        $indexes = collect(DB::select("SHOW INDEX FROM post_reactions WHERE Key_name = 'post_reactions_user_id_post_id_emoji_unique'"));
        if ($indexes->isEmpty()) {
            Schema::table('post_reactions', function (Blueprint $table) {
                $table->unique(['user_id', 'post_id', 'emoji']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('post_reactions', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'post_id', 'emoji']);
        });
    }
};

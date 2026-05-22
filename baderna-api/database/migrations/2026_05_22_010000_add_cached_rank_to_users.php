<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Cache de rank pra balancear inhouse e exibir nas listas sem
            // chamar a Riot por membro toda vez. Atualizado em bulk via job
            // ou comando, ou sob demanda quando expira.
            $table->string('cached_rank_tier')->nullable();
            $table->string('cached_rank_division', 4)->nullable();
            $table->unsignedInteger('cached_rank_lp')->nullable();
            $table->timestamp('cached_rank_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'cached_rank_tier',
                'cached_rank_division',
                'cached_rank_lp',
                'cached_rank_at',
            ]);
        });
    }
};

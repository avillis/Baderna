<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A migration anterior (2026_05_25_140000) adicionou `duo_label` por
     * engano. O código em todo o lugar usa `duo_user_id` (FK para outro user).
     * Esta migration corrige: adiciona duo_user_id e remove duo_label.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Adiciona apenas se ainda não existir (idempotente).
            if (!Schema::hasColumn('users', 'duo_user_id')) {
                $table->unsignedBigInteger('duo_user_id')->nullable()->after('duo_label');
            }
            // Remove duo_label se existir — não é usada em lugar nenhum.
            if (Schema::hasColumn('users', 'duo_label')) {
                $table->dropColumn('duo_label');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'duo_user_id')) {
                $table->dropColumn('duo_user_id');
            }
            if (!Schema::hasColumn('users', 'duo_label')) {
                $table->string('duo_label', 120)->nullable();
            }
        });
    }
};

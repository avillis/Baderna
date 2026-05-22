<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Lane preferida do jogador, usada no perfil e no inhouse-creator.
            // Valores: TOP, JG, MID, ADC, SUP (string curta).
            $table->string('primary_lane', 8)->nullable();
            $table->string('secondary_lane', 8)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['primary_lane', 'secondary_lane']);
        });
    }
};

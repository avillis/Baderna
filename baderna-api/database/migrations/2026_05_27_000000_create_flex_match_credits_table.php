<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flex_match_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('match_id', 50);
            $table->boolean('is_win');
            $table->integer('delta'); // moedas creditadas (cópia do valor
                                       // do AppSetting no momento do crédito,
                                       // pra preservar histórico se mudar)
            $table->timestamps();
            $table->unique(['user_id', 'match_id']);
            $table->index('match_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flex_match_credits');
    }
};

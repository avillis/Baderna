<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // 'title', 'capa' ou 'name'
            $table->string('kind');
            // slug do item desbloqueado (ex.: "melhor-membro-2025", "Yasuo_0.jpg",
            // "preto"). O front sabe como mapear o slug pra item.
            $table->string('slug');
            $table->timestamps();
            $table->unique(['user_id', 'kind', 'slug']);
            $table->index(['user_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_unlocks');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('post_polls')->cascadeOnDelete();
            $table->foreignId('option_id')->constrained('post_poll_options')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Um voto por opção por usuário (multi-select cria várias linhas).
            $table->unique(['option_id', 'user_id']);
            // Lookup rápido dos votos do usuário numa enquete.
            $table->index(['poll_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_poll_votes');
    }
};

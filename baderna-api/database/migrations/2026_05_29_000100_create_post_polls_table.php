<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_polls', function (Blueprint $table) {
            $table->id();
            // Uma enquete por post.
            $table->foreignId('post_id')->constrained()->cascadeOnDelete()->unique();
            $table->string('title', 200);
            // multiple = permite votar em mais de uma opção.
            $table->boolean('multiple')->default(false);
            // closes_at = quando a votação encerra (null = sem prazo).
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_polls');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('titles', function (Blueprint $table) {
            $table->id();
            // slug = identificador estável usado pelo front (ex.: "melhor-membro-2025").
            // Os títulos padrão usam slugs hardcoded; títulos custom recebem um
            // gerado a partir do label.
            $table->string('slug')->unique();
            $table->string('label');
            // iron|bronze|... usado pra estilizar a pill no front.
            $table->string('rarity');
            // tombstone pros títulos "default" que o admin escondeu/removeu.
            $table->boolean('removed')->default(false);
            // null = título default (vem da seed); preenchido = criado por admin.
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('titles');
    }
};

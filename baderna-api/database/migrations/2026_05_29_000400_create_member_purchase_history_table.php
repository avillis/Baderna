<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_purchase_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 16);            // capa | titulo | nome
            $table->string('item_id', 160);
            $table->string('item_label', 200);
            $table->string('rarity', 32);
            $table->integer('cost')->default(0);
            $table->boolean('refunded')->default(false);
            $table->boolean('free')->default(false);
            $table->integer('balance_after')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_purchase_history');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contas_lol', function (Blueprint $table) {
            $table->id();
            $table->string('summoner_name');
            $table->string('tagLine');
            $table->string('puuid');
            $table->string('elo');
            $table->integer('league_points');
            $table->integer('wins');
            $table->integer('losses');
            $table->integer('user_id')->unsigned()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contas_lol');
    }
};

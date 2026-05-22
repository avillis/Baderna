<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Marcado true quando o admin cria um "stub" de conta pra um
            // membro antes dele se cadastrar. Quando o membro fizer o
            // register com o mesmo summoner_name+tagLine, a conta é
            // reivindicada (email/password preenchidos, flag vira false).
            $table->boolean('pending_registration')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pending_registration');
        });
    }
};

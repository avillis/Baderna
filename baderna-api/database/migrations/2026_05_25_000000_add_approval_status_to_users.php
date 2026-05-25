<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Status de aprovação do cadastro:
            //   - approved: pode logar e aparece na comunidade (default → as
            //     contas que JÁ existem entram como aprovadas, ninguém é trancado).
            //   - pending: cadastrou e aguarda decisão do admin (não loga).
            //   - rejected: admin recusou (não loga).
            $table->string('approval_status')->default('approved')->after('pending_registration');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });
    }
};

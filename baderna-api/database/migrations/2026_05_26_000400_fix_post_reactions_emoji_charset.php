<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('post_reactions')) return;

        // Garante que a coluna emoji suporte emojis (utf8mb4, 4 bytes).
        // Se a coluna estava em utf8 (3 bytes), emojis eram truncados para ''
        // fazendo as contagens retornarem chave vazia e a reação sumir da UI.
        DB::statement(
            'ALTER TABLE post_reactions
             MODIFY COLUMN emoji VARCHAR(16)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );

        // Remove qualquer linha com emoji inválido/vazio que possa ter ficado
        // de inserts anteriores com charset errado.
        DB::table('post_reactions')->where('emoji', '')->delete();
        DB::table('post_reactions')->whereNull('emoji')->delete();
    }

    public function down(): void
    {
        // Não reverte charset — não há razão para voltar ao utf8.
    }
};

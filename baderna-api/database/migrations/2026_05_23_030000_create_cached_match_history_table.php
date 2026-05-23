<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cache persistente de match details da Riot.
 *
 * Por que existe: a Riot tem rate limit (20 req/s na chave dev) e cada perfil
 * precisa de até 25 detalhes de partida. Sem persistência, navegar entre 5
 * perfis estoura o limite e mostra 429. Com essa tabela:
 *   1) o backend lê as partidas conhecidas do DB (instantâneo)
 *   2) pede só a LISTA de IDs novos à Riot (1 req leve)
 *   3) baixa detalhes só dos IDs novos
 *
 * Indexado por (puuid, queue, played_at desc) pra paginar feed por queue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cached_match_history', function (Blueprint $table) {
            $table->id();
            // Riot PUUID do jogador dono da partida (sem FK pra users — pode
            // existir match de puuid que ainda não foi cadastrado no site).
            $table->string('puuid', 100);
            // Match ID no formato da Riot (BR1_5012345678, etc).
            $table->string('match_id', 60);
            // Queue Riot (400 normal, 420 SoloDuo, 440 Flex, etc). Permite
            // filtrar feed por modo sem decodificar o payload todo.
            $table->unsignedSmallInteger('queue')->nullable();
            // Timestamp do início da partida — usado pra ordenação cronológica.
            $table->timestamp('played_at')->nullable();
            // JSON completo do MatchDto da Riot — replay-ready pro frontend.
            $table->json('payload');
            $table->timestamps();

            $table->unique(['puuid', 'match_id']);
            $table->index(['puuid', 'queue', 'played_at']);
            $table->index(['puuid', 'played_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cached_match_history');
    }
};

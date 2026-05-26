<?php

namespace App\Console\Commands;

use App\Services\RankingWebhook;
use Illuminate\Console\Command;

/**
 * Posta (ou atualiza in-place) o ranking da Baderna no Discord.
 *
 * Uso:
 *   php artisan bdrn:post-ranking          # roda 1x agora
 *
 * Agendado em routes/console.php pra rodar de hora em hora.
 */
class PostRankingDiscord extends Command
{
    protected $signature = 'bdrn:post-ranking';
    protected $description = 'Posta ou atualiza o ranking da Baderna no Discord (top 10 por elo)';

    public function handle(): int
    {
        $ok = RankingWebhook::postOrUpdate();
        if ($ok) {
            $this->info('Ranking enviado/atualizado.');
            return self::SUCCESS;
        }
        $this->warn('Webhook não disparou (URL não configurada ou nada pra mostrar).');
        return self::FAILURE;
    }
}

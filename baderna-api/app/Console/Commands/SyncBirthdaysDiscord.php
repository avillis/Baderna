<?php

namespace App\Console\Commands;

use App\Services\BirthdayWebhook;
use Illuminate\Console\Command;

/**
 * Posta (ou atualiza in-place) a lista de aniversários no Discord.
 *
 * Uso:
 *   php artisan bdrn:sync-birthdays          # roda 1x agora
 *
 * Agendado em routes/console.php pra rodar diariamente à meia-noite.
 */
class SyncBirthdaysDiscord extends Command
{
    protected $signature = 'bdrn:sync-birthdays';
    protected $description = 'Posta ou atualiza os aniversários da Baderna no Discord';

    public function handle(): int
    {
        $ok = BirthdayWebhook::postOrUpdate();
        if ($ok) {
            $this->info('Aniversários enviados/atualizados.');
            return self::SUCCESS;
        }
        $this->warn('Webhook não disparou (URL não configurada ou erro).');
        return self::FAILURE;
    }
}

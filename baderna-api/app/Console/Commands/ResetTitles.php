<?php

namespace App\Console\Commands;

use App\Models\Title;
use Illuminate\Console\Command;

class ResetTitles extends Command
{
    protected $signature = 'baderna:reset-titles';
    protected $description = 'Apaga todos os títulos custom do DB (defaults vivem no front).';

    public function handle(): int
    {
        $count = Title::query()->delete();
        $this->info("✓ {$count} título(s) removido(s).");
        return self::SUCCESS;
    }
}

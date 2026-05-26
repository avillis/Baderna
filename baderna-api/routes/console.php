<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Apaga logs de erro com mais de 7 dias (configurado via Prunable no
// model ErrorLog). Roda diário às 03:00 UTC pra não competir com tráfego.
Schedule::command('model:prune', ['--model' => [\App\Models\ErrorLog::class]])
    ->daily()
    ->at('03:00');

// Atualiza o "Placar de Liderança da Baderna" no Discord — POST + PATCH
// in-place (uma mensagem única que vai sendo editada). Roda no minuto 0
// de cada hora.
Schedule::command('bdrn:post-ranking')->hourly();

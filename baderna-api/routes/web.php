<?php

use Illuminate\Support\Facades\Route;

// Tudo da API ficou em routes/api.php. Mantemos só a healthcheck root.
Route::get('/', function () {
    return response()->json([
        'service' => 'baderna-api',
        'status' => 'ok',
    ]);
});

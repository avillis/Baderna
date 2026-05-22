<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Em produção (Hostinger fica atrás de um proxy/SSL) força URL HTTPS
        // pra evitar mixed-content e URLs http:// geradas internamente.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}

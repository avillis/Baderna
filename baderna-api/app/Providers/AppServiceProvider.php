<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
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

        // O email padrão do Laravel manda pra rota /reset-password (backend).
        // Como o front é Next, sobrescrevemos pra apontar pro domínio público.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $front = rtrim(env('APP_FRONTEND_URL', 'https://bdrn.com.br'), '/');
            return $front . '/redefinir-senha?token=' . $token
                . '&email=' . urlencode($user->getEmailForPasswordReset());
        });
    }
}

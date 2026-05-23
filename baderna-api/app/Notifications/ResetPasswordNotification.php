<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Email custom de redefinição de senha — estilo Baderna (laranja).
 * Sobrescreve o template default do Laravel.
 */
class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);
        $minutes = config('auth.passwords.users.expire', 60);

        return (new MailMessage())
            ->subject('Redefinir senha · Baderna')
            ->view('emails.reset-password', [
                'url' => $url,
                'minutes' => $minutes,
                'name' => $notifiable->display_name ?: $notifiable->name,
            ]);
    }

    protected function resetUrl($notifiable): string
    {
        // Usa o callback registrado no AppServiceProvider, se houver.
        if (static::$createUrlCallback) {
            return call_user_func(static::$createUrlCallback, $notifiable, $this->token);
        }
        $front = rtrim(env('APP_FRONTEND_URL', 'https://bdrn.com.br'), '/');
        return $front . '/redefinir-senha?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
    }
}

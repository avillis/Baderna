<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Helper genérico pra mandar um email com HTML pronto (sem Blade).
 * Usado nos testes de templates que não tem fluxo dedicado.
 */
class GenericHtmlMail extends Notification
{
    use Queueable;

    public function __construct(
        private string $subject,
        private string $html,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject($this->subject)
            ->html($this->html);
    }
}

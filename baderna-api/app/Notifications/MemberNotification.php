<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notificação genérica in-app pra membros (like, comentário, menção, report…).
 * Persiste na tabela `notifications` (driver "database") e é lida via REST.
 */
class MemberNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string  $message,
        private readonly string  $actionUrl,
        private readonly ?string $authorAvatar = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message'       => $this->message,
            'action_url'    => $this->actionUrl,
            'author_avatar' => $this->authorAvatar,
        ];
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewInteractionNotification extends Notification
{
    use Queueable;

    protected $comment;
    protected $type;
    protected $targetId;

    public function __construct($comment, $type, $targetId)
    {
        $this->comment = $comment;
        $this->type = $type;
        $this->targetId = $targetId;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $authorName = $this->comment->author->display_name
            ?: ($this->comment->author->name);

        $message = match ($this->type) {
            'profile' => "{$authorName} comentou no seu perfil.",
            'post' => "{$authorName} comentou no seu post.",
            'interaction' => "{$authorName} também comentou no post que você interagiu.",
            default => "Nova interação."
        };

        return [
            'message' => $message,
            'comment_id' => $this->comment->id,
            'author_id' => $this->comment->user_id,
            'author_avatar' => $this->comment->author->avatar_src,
            'action_url' => $this->type === 'profile' ? "/membro/{$this->targetId}" : "/post/{$this->targetId}"
        ];
    }
}

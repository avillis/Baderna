<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class ErrorLog extends Model
{
    use Prunable;

    /**
     * Logs mais velhos que 7 dias são apagados automaticamente pelo
     * comando `php artisan model:prune` (agendado no Console\Kernel).
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays(7));
    }

    protected $fillable = [
        'source',
        'level',
        'message',
        'url',
        'method',
        'status_code',
        'user_id',
        'ip',
        'user_agent',
        'file',
        'line',
        'stack_trace',
        'context',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

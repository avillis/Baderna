<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inhouse extends Model
{
    protected $fillable = [
        'short_code',
        'payload',
        'created_by_user_id',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Inhouse "completo" = nenhum player em side='pool'. No modo random
     * é sempre true na criação; no modo leader vira true quando todos
     * os players da pool foram draftados.
     */
    public function isComplete(): bool
    {
        $payload = is_array($this->payload) ? $this->payload : [];
        $players = $payload['players'] ?? [];
        if (! is_array($players) || empty($players)) return false;
        foreach ($players as $p) {
            if (! is_array($p)) continue;
            if (($p['side'] ?? null) === 'pool') return false;
        }
        return true;
    }
}

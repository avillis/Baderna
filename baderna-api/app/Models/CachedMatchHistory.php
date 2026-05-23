<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Cache persistente de match details da Riot.
 * Indexado por puuid+match_id (unique) e puuid+queue+played_at (consulta).
 */
class CachedMatchHistory extends Model
{
    protected $table = 'cached_match_history';

    protected $fillable = [
        'puuid',
        'match_id',
        'queue',
        'played_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'queue' => 'integer',
            'played_at' => 'datetime',
            'payload' => 'array',
        ];
    }
}

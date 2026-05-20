<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContasLoL extends Model
{
    protected $fillable = [
        'summoner_name',
        'tagLine',
        'puuid',
        'elo',
        'league_points',
        'wins',
        'losses',
        'user_id'
    ];

    public function baderneiro()
    {
        return $this->belongsTo(baderneiros::class, 'baderneiro_id');
    }
}

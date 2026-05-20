<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Baderneiros extends Model
{
    protected $fillable = [
        'name',
        'email',
        'password',
        'summoner_name',
        'tagLine',
        'puuid',
        'rank',
        'league_points',
        'profile_icon_id',
        'user_id'
    ];
}

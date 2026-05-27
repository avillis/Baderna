<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlexMatchCredit extends Model
{
    protected $fillable = ['user_id', 'match_id', 'is_win', 'delta'];

    protected $casts = [
        'is_win' => 'boolean',
        'delta'  => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

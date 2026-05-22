<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberCoin extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = ['user_id', 'balance'];

    protected $casts = [
        'balance' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

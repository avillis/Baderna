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
}

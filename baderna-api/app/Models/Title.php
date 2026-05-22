<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Title extends Model
{
    protected $fillable = [
        'slug',
        'label',
        'rarity',
        'removed',
        'created_by_user_id',
    ];

    protected $casts = [
        'removed' => 'boolean',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}

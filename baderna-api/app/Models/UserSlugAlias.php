<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSlugAlias extends Model
{
    protected $fillable = ['slug', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

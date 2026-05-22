<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberUnlock extends Model
{
    protected $fillable = ['user_id', 'kind', 'slug'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

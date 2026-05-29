<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostPollVote extends Model
{
    protected $fillable = ['poll_id', 'option_id', 'user_id'];
}

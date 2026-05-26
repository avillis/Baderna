<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'body',
        'user_id',
        'parent_id',
        'image_url',
        'gif_url',
    ];

    public function commentable()
    {
        return $this->morphTo();
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function likes()
    {
        return $this->hasMany(CommentLike::class);
    }
}

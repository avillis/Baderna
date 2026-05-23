<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\Comment;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'image_url',
        'gif_url',
        'video_url',
        'short_code',
    ];

    protected static function booted(): void
    {
        static::creating(function (Post $post) {
            if (empty($post->short_code)) {
                // Gera um código único de 8 chars alfanuméricos.
                do {
                    $code = Str::random(8);
                } while (self::where('short_code', $code)->exists());
                $post->short_code = $code;
            }
        });
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class);
    }
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'is_deleted',
        'pending_registration',
        'profile_icon_id',
        'summoner_name',
        'tagLine',
        'riot_puuid',
        'display_name',
        'bio',
        'team_name',
        'avatar_src',
        'banner_filename',
        'active_name_id',
        'active_title_slugs',
        'cached_rank_tier',
        'cached_rank_division',
        'cached_rank_lp',
        'cached_rank_at',
        'primary_lane',
        'secondary_lane',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_deleted' => 'boolean',
            'pending_registration' => 'boolean',
            'active_title_slugs' => 'array',
            'cached_rank_at' => 'datetime',
            'cached_rank_lp' => 'integer',
        ];
    }

    public function memberCoins()
    {
        return $this->hasOne(MemberCoin::class);
    }

    public function memberUnlocks()
    {
        return $this->hasMany(MemberUnlock::class);
    }

    // Posts feitos por ESTE usuário
    public function authoredComments()
    {
        return $this->hasMany(Comment::class);
    }

    public function profileComments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}

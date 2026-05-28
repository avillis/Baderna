<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
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
        'slug',
        'email',
        'password',
        'is_admin',
        'is_deleted',
        'pending_registration',
        'approval_status',
        'profile_icon_id',
        'summoner_name',
        'tagLine',
        'riot_puuid',
        'display_name',
        'bio',
        'team_name',
        'avatar_src',
        'banner_filename',
        'banner_focus_y',
        'active_name_id',
        'active_frame_id',
        'active_title_slugs',
        'cached_rank_tier',
        'cached_rank_division',
        'cached_rank_lp',
        'cached_rank_at',
        'primary_lane',
        'secondary_lane',
        'community_highlight',
        'profile_module_order',
        'favorite_champion_slugs',
        'favorite_game_title',
        'favorite_game_cover_url',
        'duo_user_id',
        'birthday',
        'birthday_hidden',
        'spotify_access_token',
        'spotify_refresh_token',
        'spotify_token_expires_at',
        'favorite_song_spotify_id',
        'favorite_song_name',
        'favorite_song_artist',
        'favorite_song_image',
        'favorite_song_url',
    ];

    // Campos NUNCA expostos em respostas JSON automáticas (`return $user`).
    // Tem que ser explicitamente serializado se quiser mostrar (ex: o
    // próprio user vê o email via AccountController::serialize).
    protected $hidden = [
        'password',
        'remember_token',
        'email',
        'email_verified_at',
        'riot_puuid',
        'is_admin',
        'is_deleted',
        'pending_registration',
        'approval_status',
        'created_at',
        'updated_at',
        'spotify_access_token',
        'spotify_refresh_token',
        'spotify_token_expires_at',
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
            'profile_module_order' => 'array',
            'favorite_champion_slugs' => 'array',
            'duo_user_id' => 'integer',
            'birthday' => 'date',
            'birthday_hidden' => 'boolean',
            'spotify_token_expires_at' => 'datetime',
            'cached_rank_at' => 'datetime',
            'cached_rank_lp' => 'integer',
            'banner_focus_y' => 'integer',
        ];
    }

    /**
     * Sobrescreve o default pra mandar nosso template custom em pt-BR.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
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

    /**
     * Hook: quando o summoner_name muda (e por consequência o slug),
     * reescreve todas as menções `@old-slug` → `@new-slug` em posts e
     * comentários. Sem isso, mentions de histórico ficam órfãs após
     * a pessoa trocar de nick.
     */
    protected static function booted(): void
    {
        static::updating(function (User $user) {
            if (! $user->isDirty('summoner_name')) {
                return;
            }
            $oldName = $user->getOriginal('summoner_name');
            $newName = $user->summoner_name;
            \App\Services\MentionRewriter::rewriteSlugChange($oldName, $newName);
        });

        // Novo user (register / adminStore): se ninguém setou slug
        // explicitamente, deriva do summoner_name (ou name). Garante que
        // /membro/{slug-derivado} resolve pro user assim que ele aparece
        // na listagem, sem precisar editar a slug à mão.
        static::creating(function (User $user) {
            if (!empty($user->slug)) return;
            $nick = $user->summoner_name ?: $user->name;
            if (!$nick) return;
            $base = self::slugifyForCreate($nick);
            if ($base === '') return;
            $slug = $base;
            $suffix = 2;
            while (self::where('slug', $slug)->exists()) {
                $slug = $base . '-' . $suffix;
                $suffix++;
            }
            $user->slug = mb_substr($slug, 0, 30);
        });
    }

    private static function slugifyForCreate(string $nick): string
    {
        $trimmed = trim($nick);
        $ascii = @transliterator_transliterate('Any-Latin; Latin-ASCII;', $trimmed);
        if (!$ascii) $ascii = $trimmed;
        $lower = strtolower($ascii);
        $cleaned = preg_replace('/[^a-z0-9\s-]/', '', $lower) ?? '';
        $hyphenated = preg_replace('/\s+/', '-', $cleaned) ?? '';
        $dedupHyphen = preg_replace('/-+/', '-', $hyphenated) ?? '';
        return trim($dedupHyphen, '-');
    }
}

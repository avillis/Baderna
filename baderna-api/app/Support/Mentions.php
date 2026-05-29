<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\MemberNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Helpers para resolver @menções em conteúdo (posts/comentários) e disparar
 * notificações pros membros mencionados.
 *
 * Convenção: o "handle" de menção = slug do nickname (mesmo que o frontend usa
 * em /membro/{slug}). Slug = lower-case + ASCII + hifens.
 */
class Mentions
{
    /** Pattern: @slug isolado (precedido por início de string ou whitespace). */
    private const RE = '/(?:^|\s)@([a-zA-Z0-9-]+)/';

    /**
     * Extrai os slugs únicos mencionados no texto (sem resolver pra usuário).
     *
     * @return string[]
     */
    public static function parseSlugs(string $content): array
    {
        if (! str_contains($content, '@')) {
            return [];
        }
        preg_match_all(self::RE, $content, $m);
        if (empty($m[1])) {
            return [];
        }
        return array_values(array_unique(array_map('strtolower', $m[1])));
    }

    /**
     * Resolve slugs do texto pra Users existentes. Opcionalmente exclui o autor.
     *
     * @return Collection<int, User>
     */
    public static function resolve(string $content, ?int $excludeUserId = null): Collection
    {
        $slugs = self::parseSlugs($content);
        if (empty($slugs)) {
            return collect();
        }

        $query = User::select('id', 'name', 'summoner_name', 'display_name', 'avatar_src');
        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        // Filtra em PHP pra usar a mesma lógica de slug que o frontend (Str::slug
        // se aproxima bem: normaliza, lowercase, replace whitespace, etc).
        return $query->get()->filter(function (User $u) use ($slugs) {
            $slug = Str::slug((string) ($u->summoner_name ?? ''));
            return $slug !== '' && in_array($slug, $slugs, true);
        })->values();
    }

    /**
     * Dispara MemberNotification pra cada usuário mencionado (exceto o autor).
     * No-op se o conteúdo não tem menções ou se ninguém bate.
     */
    public static function notifyMentioned(
        string $content,
        User $author,
        string $message,
        string $actionUrl,
    ): void {
        $mentioned = self::resolve($content, $author->id);
        if ($mentioned->isEmpty()) {
            return;
        }

        foreach ($mentioned as $user) {
            $user->notify(new MemberNotification(
                $message,
                $actionUrl,
                $author->avatar_src,
                Str::slug((string) ($author->summoner_name ?? '')),
                self::authorDisplayName($author),
            ));
        }
    }

    /** Helper pra montar o "nome de exibição" do autor (igual ao padrão usado nos outros notifies). */
    public static function authorDisplayName(User $u): string
    {
        return $u->display_name ?: ($u->summoner_name ?: $u->name);
    }
}

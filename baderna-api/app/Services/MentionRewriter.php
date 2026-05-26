<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Reescreve menções `@old-slug` → `@new-slug` em posts e comentários quando
 * um usuário troca de summoner_name. Como o slug é derivado do nome, mudar
 * o nome quebra os links das menções antigas — esse serviço propaga o
 * rename pra todo o histórico.
 *
 * Hook: chamado automaticamente do User model via evento `updating` quando
 * summoner_name muda.
 */
class MentionRewriter
{
    /**
     * Propaga uma troca de slug em todas as menções existentes.
     * No-op se old/new geram o mesmo slug (ex.: mudou só acento ou case).
     */
    public static function rewriteSlugChange(?string $oldName, ?string $newName): int
    {
        if ($oldName === null || $oldName === '' || $newName === null || $newName === '') {
            return 0;
        }
        $oldSlug = Str::slug($oldName);
        $newSlug = Str::slug($newName);
        if ($oldSlug === '' || $newSlug === '' || $oldSlug === $newSlug) {
            return 0;
        }

        // Regex com boundary safe — `@avillis` não pode bater dentro de
        // `@avillis-2` (preserva o caractere antes/depois do match).
        $pattern = '/(^|[^a-zA-Z0-9_-])@' . preg_quote($oldSlug, '/') . '(?![a-zA-Z0-9_-])/';
        $replacement = '$1@' . $newSlug;

        $touched = 0;

        try {
            // Filtra com LIKE pra evitar puxar tudo. SQL LIKE com %@slug%
            // pega substring, depois o preg_replace garante boundary.
            $like = '%@' . $oldSlug . '%';

            Post::where('content', 'like', $like)
                ->chunkById(100, function ($chunk) use ($pattern, $replacement, &$touched) {
                    foreach ($chunk as $post) {
                        $new = preg_replace($pattern, $replacement, $post->content);
                        if ($new !== null && $new !== $post->content) {
                            $post->content = $new;
                            $post->saveQuietly();
                            $touched++;
                        }
                    }
                });

            Comment::where('body', 'like', $like)
                ->chunkById(100, function ($chunk) use ($pattern, $replacement, &$touched) {
                    foreach ($chunk as $comment) {
                        $new = preg_replace($pattern, $replacement, $comment->body);
                        if ($new !== null && $new !== $comment->body) {
                            $comment->body = $new;
                            $comment->saveQuietly();
                            $touched++;
                        }
                    }
                });
        } catch (Throwable $e) {
            Log::warning('MentionRewriter::rewriteSlugChange failed', [
                'error'   => $e->getMessage(),
                'oldSlug' => $oldSlug,
                'newSlug' => $newSlug,
            ]);
        }

        return $touched;
    }
}

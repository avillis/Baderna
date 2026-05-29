<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Post;
use App\Notifications\MemberNotification;
use App\Support\Mentions;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostCommentsController extends Controller
{
    /** Serializa um único comentário (sem replies) para JSON. */
    private function serializeComment(Comment $c, int $viewerId, ?string $parentId = null): array
    {
        $author = $c->author;
        return [
            'id'           => 'c-' . $c->id,
            'parentId'     => $parentId,
            'authorId'     => $author?->id,
            'author'       => $author?->display_name ?: ($author?->summoner_name ?: $author?->name ?: 'Membro'),
            'authorAvatar' => $author?->avatar_src,
            'body'         => $c->body,
            'imageUrl'     => $c->image_url,
            'gifUrl'       => $c->gif_url,
            'createdAt'    => $c->created_at?->getTimestampMs() ?? 0,
            'likesCount'   => $c->likes->count(),
            'likedByMe'    => $c->likes->contains('user_id', $viewerId),
        ];
    }

    public function index(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) return response()->json([], 200);

        $viewerId = $request->user()?->id ?? 0;

        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with([
                'author:id,name,summoner_name,display_name,avatar_src',
                'likes',
                'replies.author:id,name,summoner_name,display_name,avatar_src',
                'replies.likes',
            ])
            ->latest()
            ->get()
            ->map(function ($c) use ($viewerId) {
                $row = $this->serializeComment($c, $viewerId, null);
                $row['replies'] = $c->replies
                    ->sortBy('created_at')
                    ->values()
                    ->map(fn ($r) => $this->serializeComment($r, $viewerId, 'c-' . $c->id))
                    ->all();
                return $row;
            });

        return response()->json($comments);
    }

    public function store(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }

        $data = $request->validate([
            'body'      => 'nullable|string|max:1000',
            'image_url' => 'nullable|string|max:2048',
            'gif_url'   => 'nullable|string|max:2048',
            'parent_id' => 'nullable|string',
        ]);

        $body     = trim($data['body'] ?? '');
        $imageUrl = $data['image_url'] ?? null;
        $gifUrl   = $data['gif_url'] ?? null;

        if (!$body && !$imageUrl && !$gifUrl) {
            return response()->json(['error' => 'Comentário não pode ser vazio.'], 422);
        }

        // parent_id vem como "c-123" — strip prefix.
        $parentId = null;
        if (!empty($data['parent_id'])) {
            $parentId = (int) preg_replace('/^c-/', '', $data['parent_id']);
            // Verifica que o parent pertence a este post.
            $parent = $post->comments()->where('id', $parentId)->first();
            if (!$parent) {
                return response()->json(['error' => 'Comentário pai não encontrado.'], 404);
            }
        }

        $comment = $post->comments()->create([
            'body'      => $body ?: null,
            'user_id'   => $request->user()->id,
            'parent_id' => $parentId,
            'image_url' => $imageUrl,
            'gif_url'   => $gifUrl,
        ]);

        $comment->load('author:id,name,summoner_name,display_name,avatar_src', 'likes');
        $parentKey = $parentId ? 'c-' . $parentId : null;
        $row = $this->serializeComment($comment, $request->user()->id, $parentKey);
        $row['replies'] = [];

        $author    = $request->user();
        $actionUrl = '/post/' . ($post->short_code ?: $post->id);

        // Notifica o autor do post quando alguém comenta (skip self-comment).
        if ($post->user_id !== $author->id) {
            $post->loadMissing('user:id,name,display_name,summoner_name,avatar_src');
            if ($post->user) {
                $contextWord = $parentId ? 'respondeu um comentário no seu post' : 'comentou no seu post';
                $post->user->notify(new MemberNotification(
                    Mentions::authorDisplayName($author) . ' ' . $contextWord,
                    $actionUrl,
                    $author->avatar_src,
                    Str::slug((string) ($author->summoner_name ?? '')),
                    Mentions::authorDisplayName($author),
                ));
            }
        }

        // Notifica o autor do comentário pai quando alguém responde (skip self
        // e skip se o pai é o próprio autor do post — ele já foi notificado acima).
        if ($parentId && isset($parent) && $parent->user
            && $parent->user_id !== $author->id
            && $parent->user_id !== $post->user_id
        ) {
            $parent->loadMissing('user:id,name,display_name,summoner_name,avatar_src');
            $parent->user->notify(new MemberNotification(
                Mentions::authorDisplayName($author) . ' respondeu seu comentário',
                $actionUrl,
                $author->avatar_src,
            ));
        }

        // Notifica @mencionados no body (skip self).
        if ($body) {
            $contextWord = $parentId ? 'em uma resposta' : 'em um comentário';
            Mentions::notifyMentioned(
                $body,
                $author,
                Mentions::authorDisplayName($author) . ' mencionou você ' . $contextWord,
                $actionUrl,
            );
        }

        return response()->json($row, 201);
    }

    public function destroy(Request $request, int $id, string $commentId)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $cid = (int) preg_replace('/^c-/', '', $commentId);

        // Pode ser um comentário direto ou uma reply.
        $comment = Comment::where('id', $cid)
            ->where(function ($q) use ($post) {
                $q->whereHasMorph('commentable', [Post::class], fn ($q2) => $q2->where('id', $post->id))
                  ->orWhereHas('commentable', fn ($q2) => $q2->where('commentable_type', Post::class))
                  ->orWhereIn('parent_id', $post->comments()->select('id'));
            })
            ->first();

        // Fallback: busca diretamente pelo post morph.
        if (!$comment) {
            $comment = $post->comments()->where('id', $cid)->first();
        }
        if (!$comment) {
            // Tenta como reply de algum comentário do post.
            $postCommentIds = $post->comments()->pluck('id');
            $comment = Comment::where('id', $cid)
                ->whereIn('parent_id', $postCommentIds)
                ->first();
        }

        if (!$comment) return response()->json(null, 204);

        $authUser = $request->user();
        $canDelete =
            $comment->user_id === $authUser->id ||
            $post->user_id    === $authUser->id ||
            $authUser->is_admin;

        if (!$canDelete) {
            return response()->json(['error' => 'Sem permissão.'], 403);
        }
        $comment->delete();
        return response()->json(null, 204);
    }

    public function toggleLike(Request $request, int $id, string $commentId)
    {
        $post = Post::find($id);
        if (!$post) return response()->json(['error' => 'Post não encontrado.'], 404);

        $cid = (int) preg_replace('/^c-/', '', $commentId);

        // Aceita tanto comentário direto quanto reply.
        $postCommentIds = $post->comments()->pluck('id');
        $comment = Comment::where('id', $cid)
            ->where(function ($q) use ($postCommentIds) {
                $q->whereIn('id', $postCommentIds)
                  ->orWhereIn('parent_id', $postCommentIds);
            })
            ->first();

        if (!$comment) return response()->json(['error' => 'Comentário não encontrado.'], 404);

        $userId  = $request->user()->id;
        $existing = CommentLike::where('comment_id', $cid)->where('user_id', $userId)->first();

        if ($existing) {
            $existing->delete();
            $likedByMe = false;
        } else {
            CommentLike::create(['comment_id' => $cid, 'user_id' => $userId]);
            $likedByMe = true;
        }

        // Notifica o autor do comentário quando alguém curte (skip self-like).
        if ($likedByMe && $comment->user_id !== $userId) {
            $comment->loadMissing('user:id,name,display_name,summoner_name,avatar_src');
            if ($comment->user) {
                $liker    = $request->user();
                $actionUrl = '/post/' . ($post->short_code ?: $post->id);
                $comment->user->notify(new MemberNotification(
                    Mentions::authorDisplayName($liker) . ' curtiu seu comentário',
                    $actionUrl,
                    $liker->avatar_src,
                ));
            }
        }

        $likesCount = CommentLike::where('comment_id', $cid)->count();
        return response()->json(['likesCount' => $likesCount, 'likedByMe' => $likedByMe]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Post;
use Illuminate\Http\Request;

class PostCommentsController extends Controller
{
    /** Formata um comentário (ou reply) para o formato da API. */
    private function formatComment(Comment $c, ?int $authUserId, bool $includeReplies = true): array
    {
        $author = $c->author;
        $likesCount = $c->likes->count();
        $likedByMe  = $authUserId
            ? $c->likes->contains('user_id', $authUserId)
            : false;

        $data = [
            'id'           => 'c-' . $c->id,
            'authorId'     => $author?->id,
            'author'       => $author?->display_name ?: ($author?->summoner_name ?: $author?->name ?: 'Membro'),
            'authorAvatar' => $author?->avatar_src,
            'body'         => $c->body,
            'imageUrl'     => $c->image_url,
            'gifUrl'       => $c->gif_url,
            'createdAt'    => $c->created_at?->getTimestampMs() ?? 0,
            'likesCount'   => $likesCount,
            'likedByMe'    => $likedByMe,
        ];

        if ($c->parent_id !== null) {
            $data['parentId'] = 'c-' . $c->parent_id;
        }

        if ($includeReplies) {
            $data['replies'] = $c->replies
                ->map(fn($r) => $this->formatComment($r, $authUserId, false))
                ->values()
                ->toArray();
        }

        return $data;
    }

    public function index(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) return response()->json([], 200);

        $authUserId = $request->user()?->id;

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
            ->map(fn($c) => $this->formatComment($c, $authUserId, true));

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
            'image_url' => 'nullable|string|max:2000',
            'gif_url'   => 'nullable|string|max:2000',
            'parent_id' => 'nullable|string',
        ]);

        $body     = trim($data['body'] ?? '');
        $imageUrl = $data['image_url'] ?? null;
        $gifUrl   = $data['gif_url'] ?? null;

        if (!$body && !$imageUrl && !$gifUrl) {
            return response()->json(['error' => 'Comentário precisa de texto ou mídia.'], 422);
        }

        // Strip "c-" prefix from parent_id if present.
        $parentId = null;
        if (!empty($data['parent_id'])) {
            $parentId = (int) preg_replace('/^c-/', '', $data['parent_id']);
            // Verify the parent belongs to this post.
            $parentExists = $post->comments()->where('id', $parentId)->whereNull('parent_id')->exists();
            if (!$parentExists) {
                return response()->json(['error' => 'Comentário pai não encontrado.'], 404);
            }
        }

        $comment = $post->comments()->create([
            'body'      => $body ?: null,
            'user_id'   => $request->user()->id,
            'image_url' => $imageUrl,
            'gif_url'   => $gifUrl,
            'parent_id' => $parentId,
        ]);

        $comment->load([
            'author:id,name,summoner_name,display_name,avatar_src',
            'likes',
        ]);

        return response()->json($this->formatComment($comment, $request->user()->id, false), 201);
    }

    public function destroy(Request $request, int $id, string $commentId)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $cid = (int) preg_replace('/^c-/', '', $commentId);
        $comment = $post->comments()->where('id', $cid)->first();
        if (!$comment) return response()->json(null, 204);

        // Autor do comentário, dono do post ou admin podem apagar.
        $authUser = $request->user();
        $canDelete =
            $comment->user_id === $authUser->id ||
            $post->user_id === $authUser->id ||
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
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }

        $cid = (int) preg_replace('/^c-/', '', $commentId);

        // The comment must belong to this post (either directly or as a reply).
        $comment = Comment::where('id', $cid)
            ->where(function ($q) use ($id) {
                // Direct comment on the post.
                $q->where('commentable_type', 'App\\Models\\Post')
                  ->where('commentable_id', $id);
            })
            ->orWhere(function ($q) use ($id) {
                // Reply whose parent is a comment on this post.
                $q->whereNotNull('parent_id')
                  ->whereHas('commentable', function ($sq) use ($id) {
                      $sq->where('id', $id);
                  });
            })
            ->first();

        // Simpler fallback: just make sure it's reachable via the post's comments tree.
        if (!$comment) {
            $comment = Comment::where('id', $cid)->first();
            if (!$comment) {
                return response()->json(['error' => 'Comentário não encontrado.'], 404);
            }
            // Verify it belongs to the post (direct or reply).
            $rootId = $comment->parent_id ?? $comment->id;
            $belongsToPost = $post->comments()->where('id', $rootId)->exists();
            if (!$belongsToPost) {
                return response()->json(['error' => 'Comentário não pertence ao post.'], 404);
            }
        }

        $userId = $request->user()->id;
        $existing = CommentLike::where('comment_id', $cid)->where('user_id', $userId)->first();

        if ($existing) {
            $existing->delete();
            $likedByMe = false;
        } else {
            CommentLike::create(['comment_id' => $cid, 'user_id' => $userId]);
            $likedByMe = true;
        }

        $likesCount = CommentLike::where('comment_id', $cid)->count();

        return response()->json([
            'likesCount' => $likesCount,
            'likedByMe'  => $likedByMe,
        ]);
    }
}

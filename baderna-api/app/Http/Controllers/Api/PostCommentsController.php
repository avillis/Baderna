<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostCommentsController extends Controller
{
    public function index(int $id)
    {
        $post = Post::find($id);
        if (!$post) return response()->json([], 200);

        $comments = $post->comments()
            ->with('author:id,name,summoner_name,display_name,avatar_src')
            ->latest()
            ->get()
            ->map(function ($c) {
                $author = $c->author;
                return [
                    'id'           => 'c-' . $c->id,
                    'authorId'     => $author?->id,
                    'author'       => $author?->display_name ?: ($author?->summoner_name ?: $author?->name ?: 'Membro'),
                    'authorAvatar' => $author?->avatar_src,
                    'body'         => $c->body,
                    'createdAt'    => $c->created_at?->getTimestampMs() ?? 0,
                ];
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
            'body' => 'required|string|max:1000',
        ]);

        $comment = $post->comments()->create([
            'body'    => $data['body'],
            'user_id' => $request->user()->id,
        ]);

        $comment->load('author:id,name,summoner_name,display_name,avatar_src');
        $author = $comment->author;

        return response()->json([
            'id'           => 'c-' . $comment->id,
            'authorId'     => $author?->id,
            'author'       => $author?->display_name ?: ($author?->summoner_name ?: $author?->name ?: 'Membro'),
            'authorAvatar' => $author?->avatar_src,
            'body'         => $comment->body,
            'createdAt'    => $comment->created_at?->getTimestampMs() ?? 0,
        ], 201);
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
}

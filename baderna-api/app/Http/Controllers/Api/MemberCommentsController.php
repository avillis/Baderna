<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class MemberCommentsController extends Controller
{
    /**
     * Resolve um membro pelo "slug" — primeiro tenta encontrar como user_id
     * (rota /membro/1), depois como summoner_name (rota /membro/avillis).
     */
    private function resolveUser(string $slug): ?User
    {
        if (ctype_digit($slug)) {
            return User::find((int)$slug);
        }
        // O slug do front é lowercase com hífens em vez de espaços.
        $lower = strtolower($slug);
        $withSpaces = str_replace('-', ' ', $lower);
        return User::whereRaw('LOWER(summoner_name) IN (?, ?)', [$lower, $withSpaces])->first();
    }

    public function index(string $slug)
    {
        $user = $this->resolveUser($slug);
        if (!$user) return response()->json([], 200);

        $comments = $user->profileComments()
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

    public function store(Request $request, string $slug)
    {
        $user = $this->resolveUser($slug);
        if (!$user) {
            return response()->json(['error' => 'Membro não encontrado.'], 404);
        }
        $data = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = $user->profileComments()->create([
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

    public function destroy(Request $request, string $slug, string $commentId)
    {
        $user = $this->resolveUser($slug);
        if (!$user) {
            return response()->json(['error' => 'Membro não encontrado.'], 404);
        }
        // commentId vem como "c-123" do front; tira o prefixo.
        $id = (int) preg_replace('/^c-/', '', $commentId);
        $comment = $user->profileComments()->where('id', $id)->first();
        if (!$comment) return response()->json(null, 204);

        // Autor do comentário OU admin podem apagar.
        $authUser = $request->user();
        if ($comment->user_id !== $authUser->id && !$authUser->is_admin) {
            return response()->json(['error' => 'Sem permissão.'], 403);
        }
        $comment->delete();
        return response()->json(null, 204);
    }
}

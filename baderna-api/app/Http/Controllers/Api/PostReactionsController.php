<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostReaction;
use Illuminate\Http\Request;

class PostReactionsController extends Controller
{
    /**
     * GET /posts/{id}/reactions
     * Retorna contagens por emoji e quais o usuário logado já reagiu.
     *
     * Response: { reactions: { "👍": 3, "🔥": 1, ... }, mine: ["👍", "🔥"] }
     */
    public function show(Request $request, int $id)
    {
        if (!Post::where('id', $id)->exists()) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }

        $userId = $request->user()->id;

        // Contagens agregadas por emoji
        $rows = PostReaction::where('post_id', $id)
            ->selectRaw('emoji, COUNT(*) as cnt')
            ->groupBy('emoji')
            ->get();

        $reactions = [];
        foreach ($rows as $row) {
            $reactions[$row->emoji] = (int) $row->cnt;
        }

        $mine = PostReaction::where('post_id', $id)
            ->where('user_id', $userId)
            ->pluck('emoji')
            ->values()
            ->toArray();

        return response()->json(['reactions' => $reactions, 'mine' => $mine]);
    }

    /**
     * POST /posts/{id}/reactions
     * Corpo: { emoji: "👍" }
     * Toggle: adiciona se não existe, remove se já existe.
     * Múltiplos emojis por usuário por post são permitidos.
     *
     * Response: { reactions: { ... }, mine: string[] }
     */
    public function toggle(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }

        $data   = $request->validate(['emoji' => 'required|string|max:16']);
        $emoji  = $data['emoji'];
        $userId = $request->user()->id;

        $count = PostReaction::where('user_id', $userId)
            ->where('post_id', $id)
            ->where('emoji', $emoji)
            ->count();

        if ($count > 0) {
            // Deleta TODOS os registros com esse emoji (limpa duplicatas).
            PostReaction::where('user_id', $userId)
                ->where('post_id', $id)
                ->where('emoji', $emoji)
                ->delete();
        } else {
            PostReaction::create([
                'user_id' => $userId,
                'post_id' => $id,
                'emoji'   => $emoji,
            ]);
        }

        // Retorna estado canônico pós-operação
        $rows = PostReaction::where('post_id', $id)
            ->selectRaw('emoji, COUNT(*) as cnt')
            ->groupBy('emoji')
            ->get();

        $reactions = [];
        foreach ($rows as $row) {
            $reactions[$row->emoji] = (int) $row->cnt;
        }

        $mine = PostReaction::where('post_id', $id)
            ->where('user_id', $userId)
            ->pluck('emoji')
            ->values()
            ->toArray();

        return response()->json(['reactions' => $reactions, 'mine' => $mine]);
    }
}

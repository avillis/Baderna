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

        // Emoji do user logado neste post (máx 1)
        $mine = PostReaction::where('post_id', $id)
            ->where('user_id', $userId)
            ->value('emoji'); // null se não reagiu

        return response()->json(['reactions' => $reactions, 'mine' => $mine]);
    }

    /**
     * POST /posts/{id}/reactions
     * Corpo: { emoji: "👍" }
     * Uma reação por usuário por post. Clicar no mesmo emoji remove; clicar
     * em outro troca (remove o anterior, adiciona o novo).
     *
     * Response: { reactions: { ... }, mine: string|null }
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

        $existing = PostReaction::where('user_id', $userId)
            ->where('post_id', $id)
            ->first();

        if ($existing && $existing->emoji === $emoji) {
            // Clicou no mesmo — remove.
            $existing->delete();
        } else {
            // Clicou em outro (ou não tinha) — substitui/cria.
            PostReaction::updateOrCreate(
                ['user_id' => $userId, 'post_id' => $id],
                ['emoji' => $emoji],
            );
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
            ->value('emoji'); // null se não existe

        return response()->json(['reactions' => $reactions, 'mine' => $mine]);
    }
}

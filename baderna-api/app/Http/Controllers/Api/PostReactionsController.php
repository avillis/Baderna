<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PostReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostReactionsController extends Controller
{
    /**
     * GET /posts/{postId}/reactions
     * Retorna: { reactions: {emoji: count, ...}, mine: string[] }
     */
    public function show(int $postId)
    {
        $userId = Auth::id();

        // Contagem total por emoji neste post
        $reactions = PostReaction::where('post_id', $postId)
            ->selectRaw('emoji, COUNT(*) as total')
            ->groupBy('emoji')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->emoji => (int) $row->total])
            ->toArray();

        // Emojis que o usuário atual já reagiu
        $mine = PostReaction::where('post_id', $postId)
            ->where('user_id', $userId)
            ->pluck('emoji')
            ->toArray();

        return response()->json([
            'reactions' => $reactions,
            'mine'      => $mine,
        ]);
    }

    /**
     * POST /posts/{postId}/reactions
     * Body: { emoji: "🔥" }
     * Toggle: adiciona se não existe, remove se já existe.
     * Retorna o mesmo shape de show().
     */
    public function toggle(Request $request, int $postId)
    {
        $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $emoji  = $request->input('emoji');
        $userId = Auth::id();

        $existing = PostReaction::where([
            'user_id' => $userId,
            'post_id' => $postId,
            'emoji'   => $emoji,
        ])->first();

        if ($existing) {
            $existing->delete();
        } else {
            PostReaction::create([
                'user_id' => $userId,
                'post_id' => $postId,
                'emoji'   => $emoji,
            ]);
        }

        return $this->show($postId);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostPinController extends Controller
{
    /**
     * Toggle: fixa o post no perfil do usuário autenticado se não estava fixado,
     * ou desfixar se já era o post fixado. Só posts do próprio usuário.
     */
    public function toggle(Request $request, int $id)
    {
        $user = $request->user();
        $post = Post::findOrFail($id);

        if ($post->user_id !== $user->id) {
            return response()->json(['error' => 'Você só pode fixar seus próprios posts.'], 403);
        }

        // Toggle: desfixar se já é este; fixar se é outro (ou nenhum).
        if ((int) $user->pinned_post_id === $post->id) {
            $user->pinned_post_id = null;
        } else {
            $user->pinned_post_id = $post->id;
        }
        $user->save();

        return response()->json(['pinned' => $user->pinned_post_id !== null]);
    }
}

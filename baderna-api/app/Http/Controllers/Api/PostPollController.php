<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostPollOption;
use App\Models\PostPollVote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostPollController extends Controller
{
    /**
     * Vota/desvota numa opção da enquete. Voto é mutável:
     *  - single (multiple=false): clicar numa opção troca seu voto; clicar na
     *    opção que você já votou remove o voto.
     *  - multiple (multiple=true): cada opção é um toggle independente.
     * Bloqueia se a enquete já encerrou.
     */
    public function vote(Request $request, int $id)
    {
        $data = $request->validate([
            'option_id' => 'required|integer',
        ]);

        $post = Post::with('poll')->find($id);
        if (! $post || ! $post->poll) {
            return response()->json(['error' => 'Enquete não encontrada.'], 404);
        }

        $poll = $post->poll;
        if ($poll->isClosed()) {
            return response()->json(['error' => 'Enquete encerrada.'], 422);
        }

        $option = PostPollOption::where('poll_id', $poll->id)
            ->where('id', $data['option_id'])
            ->first();
        if (! $option) {
            return response()->json(['error' => 'Opção inválida.'], 404);
        }

        $userId = $request->user()->id;

        DB::transaction(function () use ($poll, $option, $userId) {
            if ($poll->multiple) {
                // Toggle só desta opção.
                $existing = PostPollVote::where('option_id', $option->id)
                    ->where('user_id', $userId)
                    ->first();
                if ($existing) {
                    $existing->delete();
                } else {
                    PostPollVote::create([
                        'poll_id'   => $poll->id,
                        'option_id' => $option->id,
                        'user_id'   => $userId,
                    ]);
                }
            } else {
                // Single: remove todos os votos do user na enquete e, se não era
                // esta opção, registra o novo voto (clicar na atual = desvotar).
                $mine = PostPollVote::where('poll_id', $poll->id)
                    ->where('user_id', $userId)
                    ->get();
                $hadThis = $mine->contains('option_id', $option->id);
                foreach ($mine as $v) {
                    $v->delete();
                }
                if (! $hadThis) {
                    PostPollVote::create([
                        'poll_id'   => $poll->id,
                        'option_id' => $option->id,
                        'user_id'   => $userId,
                    ]);
                }
            }
        });

        return response()->json([
            'poll' => $poll->fresh()->serialize($userId),
        ]);
    }
}

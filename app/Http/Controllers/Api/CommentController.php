<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;

class CommentController extends Controller
{
    public function store(Request $request, $type, $id)
    {
        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $modelClass = $type === 'posts' ? Post::class : User::class;

        $entity = $modelClass::findOrFail($id);

        $comment = $entity->comments()->create([
            'body' => $request->body,
            'user_id' => $request->user()->id,
        ]);

        $comment->load('author:id,name,summoner_name');

        return response()->json([
            'message' => 'Comentário adicionado com sucesso.',
            'comment' => $comment
        ], 201);
    }
}

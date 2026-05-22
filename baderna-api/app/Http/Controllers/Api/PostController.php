<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Lista posts mais recentes primeiro. Pagina simples (cursor by id).
     * Query params: ?before=<id> pra paginar pra trás. Limite fixo de 20.
     */
    public function index(Request $request)
    {
        $q = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src'])
            ->orderByDesc('id')
            ->limit(20);

        if ($before = $request->query('before')) {
            $q->where('id', '<', (int) $before);
        }

        $posts = $q->get()->map(fn ($p) => $this->serialize($p));
        return response()->json(['posts' => $posts]);
    }

    /**
     * Cria post. Aceita texto + opcionalmente image_url e/ou gif_url.
     * O upload de imagem é feito separado em POST /posts/image — aqui só
     * recebemos a URL final.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'content'   => 'required|string|max:2000',
            'image_url' => 'nullable|string|max:500',
            'gif_url'   => 'nullable|string|max:500',
        ]);

        $post = Post::create([
            'user_id'   => $request->user()->id,
            'content'   => $data['content'],
            'image_url' => $data['image_url'] ?? null,
            'gif_url'   => $data['gif_url'] ?? null,
        ]);

        $post->load('user:id,name,display_name,summoner_name,tagLine,avatar_src');

        return response()->json(['post' => $this->serialize($post)], 201);
    }

    /**
     * Upload de imagem pra anexar a um post. Mesmo padrão do avatar:
     * salva em storage/app/public/posts/{filename} e devolve URL absoluta.
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|mimes:png,jpg,jpeg,webp,gif|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');

        $owner = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($user->summoner_name ?? 'user'));
        $owner = substr($owner, 0, 32) ?: 'user';
        $filename = $owner . '-' . time() . '-' . bin2hex(random_bytes(3)) . '.' . $file->getClientOriginalExtension();

        $path = $file->storeAs('posts', $filename, 'public');

        return response()->json([
            'url' => url(Storage::url($path)),
        ]);
    }

    private function serialize(Post $post): array
    {
        $u = $post->user;
        $summoner = $u?->summoner_name ?? '';
        $tag      = $u?->tagLine ?? '';

        return [
            'id'        => $post->id,
            'content'   => $post->content,
            'imageUrl'  => $post->image_url,
            'gifUrl'    => $post->gif_url,
            'createdAt' => $post->created_at?->toIso8601String(),
            'author'    => [
                'id'        => $u?->id,
                'name'      => $u?->display_name ?: $u?->name,
                'gameNick'  => $summoner && $tag ? "{$summoner}#{$tag}" : ($summoner ?: ''),
                'avatarSrc' => $u?->avatar_src,
            ],
        ];
    }
}

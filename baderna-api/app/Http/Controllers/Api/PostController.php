<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $q = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src'])
            ->withCount(['likes', 'comments'])
            ->orderByDesc('id')
            ->limit(5);

        if ($before = $request->query('before')) {
            $q->where('id', '<', (int) $before);
        }

        $posts = $q->get();

        // IDs dos posts que o user logado curtiu (single query, IN clause)
        $likedIds = PostLike::where('user_id', $userId)
            ->whereIn('post_id', $posts->pluck('id'))
            ->pluck('post_id')
            ->toArray();

        return response()->json([
            'posts' => $posts->map(fn ($p) => $this->serialize($p, $likedIds)),
        ]);
    }

    public function show(Request $request, string $idOrCode)
    {
        $userId = $request->user()->id;
        $query = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src'])
            ->withCount(['likes', 'comments']);

        // Aceita ID numérico (compat com links antigos) OU short_code novo.
        $post = ctype_digit($idOrCode)
            ? $query->find((int)$idOrCode)
            : $query->where('short_code', $idOrCode)->first();

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $liked = PostLike::where('user_id', $userId)->where('post_id', $post->id)->exists();
        return response()->json([
            'post' => $this->serialize($post, $liked ? [$post->id] : []),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content'   => 'nullable|string|max:2000',
            'image_url' => 'nullable|string|max:1000',
            'gif_url'   => 'nullable|string|max:1000',
            'video_url' => 'nullable|string|max:1000',
        ]);

        // Precisa de pelo menos UM dos quatro (não dá pra postar nada vazio).
        $content = trim((string)($data['content'] ?? ''));
        $imageUrl = $data['image_url'] ?? null;
        $gifUrl = $data['gif_url'] ?? null;
        $videoUrl = $data['video_url'] ?? null;
        if ($content === '' && !$imageUrl && !$gifUrl && !$videoUrl) {
            return response()->json([
                'errors' => ['content' => ['Adicione um texto, imagem, GIF ou vídeo.']],
            ], 422);
        }

        $post = Post::create([
            'user_id'   => $request->user()->id,
            'content'   => $content,
            'image_url' => $imageUrl,
            'gif_url'   => $gifUrl,
            'video_url' => $videoUrl,
        ]);

        $post->load('user:id,name,display_name,summoner_name,tagLine,avatar_src');
        $post->loadCount(['likes', 'comments']);

        return response()->json(['post' => $this->serialize($post, [])], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(null, 204);
        }
        $user = $request->user();
        // Ownership: dono ou admin podem deletar.
        if ($post->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['error' => 'Sem permissão.'], 403);
        }
        $post->delete();
        return response()->json(null, 204);
    }

    /**
     * Toggle like: cria se não existe, deleta se já existe. Idempotente.
     * Resposta: { liked: bool, likesCount: int }.
     */
    public function toggleLike(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $userId = $request->user()->id;
        $existing = PostLike::where('user_id', $userId)
            ->where('post_id', $id)
            ->first();
        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            PostLike::create(['user_id' => $userId, 'post_id' => $id]);
            $liked = true;
        }
        $count = PostLike::where('post_id', $id)->count();
        return response()->json(['liked' => $liked, 'likesCount' => $count]);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|mimes:png,jpg,jpeg,webp,gif|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');

        $owner = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($user->summoner_name ?? 'user'));
        $owner = substr($owner, 0, 32) ?: 'user';
        $ext = match ($file->getMimeType()) {
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            default      => 'jpg',
        };
        $filename = $owner . '-' . time() . '-' . bin2hex(random_bytes(3)) . '.' . $ext;

        $path = $file->storeAs('posts', $filename, 'public');

        return response()->json([
            'url' => url(Storage::url($path)),
        ]);
    }

    public function uploadVideo(Request $request)
    {
        // Limite de 20MB (20480 KB). MP4/WebM/MOV cobrem o que browsers
        // conseguem reproduzir nativamente.
        $request->validate([
            'file' => 'required|file|mimes:mp4,webm,mov,m4v|max:20480',
        ]);

        $user = $request->user();
        $file = $request->file('file');

        $owner = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($user->summoner_name ?? 'user'));
        $owner = substr($owner, 0, 32) ?: 'user';
        $ext = match ($file->getMimeType()) {
            'video/webm'      => 'webm',
            'video/quicktime' => 'mov',
            default           => 'mp4',
        };
        $filename = $owner . '-' . time() . '-' . bin2hex(random_bytes(3)) . '.' . $ext;

        $path = $file->storeAs('posts', $filename, 'public');

        return response()->json([
            'url' => url(Storage::url($path)),
        ]);
    }

    private function serialize(Post $post, array $likedIds): array
    {
        $u = $post->user;
        $summoner = $u?->summoner_name ?? '';
        $tag      = $u?->tagLine ?? '';

        return [
            'id'         => $post->id,
            'shortCode'  => $post->short_code,
            'content'    => $post->content,
            'imageUrl'   => $post->image_url,
            'gifUrl'     => $post->gif_url,
            'videoUrl'   => $post->video_url,
            'createdAt'  => $post->created_at?->toIso8601String(),
            'likesCount' => $post->likes_count ?? 0,
            'commentsCount' => $post->comments_count ?? 0,
            'liked'      => in_array($post->id, $likedIds, true),
            'author'     => [
                'id'        => $u?->id,
                'name'      => $u?->display_name ?: $u?->name,
                'gameNick'  => $summoner && $tag ? "{$summoner}#{$tag}" : ($summoner ?: ''),
                'avatarSrc' => $u?->avatar_src,
            ],
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostBookmark;
use App\Models\PostLike;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\User;
use App\Notifications\MemberNotification;
use App\Support\Mentions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $q = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src', 'poll.options'])
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

        // IDs dos posts que o user salvou
        $bookmarkedIds = PostBookmark::where('user_id', $userId)
            ->whereIn('post_id', $posts->pluck('id'))
            ->pluck('post_id')
            ->toArray();

        return response()->json([
            'posts' => $posts->map(fn ($p) => $this->serialize($p, $likedIds, $bookmarkedIds, $userId)),
        ]);
    }

    public function show(Request $request, string $idOrCode)
    {
        $userId = $request->user()->id;
        $query = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src', 'poll.options'])
            ->withCount(['likes', 'comments']);

        // Aceita ID numérico (compat com links antigos) OU short_code novo.
        $post = ctype_digit($idOrCode)
            ? $query->find((int)$idOrCode)
            : $query->where('short_code', $idOrCode)->first();

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $liked = PostLike::where('user_id', $userId)->where('post_id', $post->id)->exists();
        $bookmarked = PostBookmark::where('user_id', $userId)->where('post_id', $post->id)->exists();
        return response()->json([
            'post' => $this->serialize($post, $liked ? [$post->id] : [], $bookmarked ? [$post->id] : [], $userId),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content'   => 'nullable|string|max:2000',
            'image_url' => 'nullable|string|max:1000',
            'gif_url'   => 'nullable|string|max:1000',
            'video_url' => 'nullable|string|max:1000',
            // Enquete (opcional). Mutuamente exclusiva com mídia no frontend.
            'poll'                     => 'nullable|array',
            'poll.title'               => 'required_with:poll|string|max:200',
            'poll.multiple'            => 'nullable|boolean',
            'poll.duration_minutes'    => 'nullable|integer|min:5|max:10080',
            'poll.options'             => 'required_with:poll|array|min:2|max:6',
            'poll.options.*.text'      => 'required|string|max:80',
            'poll.options.*.image_url' => 'nullable|string|max:1000',
        ]);

        $pollData = $data['poll'] ?? null;

        // Enquete e mídia são mutuamente exclusivas; enquete tem prioridade.
        $content = trim((string)($data['content'] ?? ''));
        $imageUrl = $pollData ? null : ($data['image_url'] ?? null);
        $gifUrl   = $pollData ? null : ($data['gif_url'] ?? null);
        $videoUrl = $pollData ? null : ($data['video_url'] ?? null);

        // Precisa de pelo menos UM: texto, mídia ou enquete.
        if ($content === '' && !$imageUrl && !$gifUrl && !$videoUrl && !$pollData) {
            return response()->json([
                'errors' => ['content' => ['Adicione um texto, imagem, GIF, vídeo ou enquete.']],
            ], 422);
        }

        $post = Post::create([
            'user_id'   => $request->user()->id,
            'content'   => $content,
            'image_url' => $imageUrl,
            'gif_url'   => $gifUrl,
            'video_url' => $videoUrl,
        ]);

        // Cria a enquete + opções (descarta opções com texto vazio; valida >=2).
        if ($pollData) {
            $minutes = (int) ($pollData['duration_minutes'] ?? 0);
            $closesAt = $minutes > 0 ? now()->addMinutes($minutes) : now()->addDay();
            $poll = PostPoll::create([
                'post_id'   => $post->id,
                'title'     => trim($pollData['title']),
                'multiple'  => (bool) ($pollData['multiple'] ?? false),
                'closes_at' => $closesAt,
            ]);
            $position = 0;
            foreach (array_values($pollData['options']) as $opt) {
                $text = trim((string) ($opt['text'] ?? ''));
                if ($text === '') continue;
                PostPollOption::create([
                    'poll_id'   => $poll->id,
                    'text'      => $text,
                    'image_url' => $opt['image_url'] ?? null,
                    'position'  => $position++,
                ]);
            }
            // Se sobrou menos de 2 opções válidas, desfaz tudo.
            if ($position < 2) {
                $post->delete(); // cascade derruba poll+options
                return response()->json([
                    'errors' => ['poll' => ['A enquete precisa de pelo menos 2 opções.']],
                ], 422);
            }
        }

        $post->load('user:id,name,display_name,summoner_name,tagLine,avatar_src', 'poll.options');
        $post->loadCount(['likes', 'comments']);

        // Notifica @mencionados no conteúdo (skip self).
        if ($content !== '') {
            $author = $request->user();
            $actionUrl = '/post/' . ($post->short_code ?: $post->id);
            Mentions::notifyMentioned(
                $content,
                $author,
                Mentions::authorDisplayName($author) . ' mencionou você em um post',
                $actionUrl,
            );
        }

        return response()->json(['post' => $this->serialize($post, [], [], $request->user()->id)], 201);
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

            // Notifica o autor do post (nunca self-like).
            if ($post->user_id !== $userId) {
                $post->loadMissing('user:id,name,display_name,summoner_name,avatar_src');
                if ($post->user) {
                    $liker     = $request->user();
                    $actionUrl = '/post/' . ($post->short_code ?: $post->id);
                    $post->user->notify(new MemberNotification(
                        Mentions::authorDisplayName($liker) . ' curtiu seu post',
                        $actionUrl,
                        $liker->avatar_src,
                    ));
                }
            }
        }
        $count = PostLike::where('post_id', $id)->count();
        return response()->json(['liked' => $liked, 'likesCount' => $count]);
    }

    /**
     * Reporta um post. Notifica todos os admins via MemberNotification.
     * Rate-limited no nível de rota (3/h por usuário) pra evitar spam.
     * - Não permite reportar próprio post.
     * - Idempotente do ponto de vista do usuário (sempre retorna 204), mas
     *   o rate limit segura múltiplos reports do mesmo user em sequência.
     */
    public function report(Request $request, int $id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post não encontrado.'], 404);
        }
        $reporter = $request->user();
        if ($post->user_id === $reporter->id) {
            return response()->json(['error' => 'Não dá pra reportar o próprio post.'], 422);
        }

        // Notifica todos os admins (exceto o próprio reporter caso seja admin
        // e exceto o autor caso seja admin — evitar self-notify).
        $admins = User::where('is_admin', true)
            ->where('id', '!=', $reporter->id)
            ->where('id', '!=', $post->user_id)
            ->get();

        $reporterName = Mentions::authorDisplayName($reporter);
        $actionUrl = '/post/' . ($post->short_code ?: $post->id);

        foreach ($admins as $admin) {
            $admin->notify(new MemberNotification(
                "{$reporterName} reportou um post",
                $actionUrl,
                $reporter->avatar_src,
            ));
        }

        return response()->json(null, 204);
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

    private function serialize(Post $post, array $likedIds, array $bookmarkedIds = [], ?int $viewerId = null): array
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
            'bookmarked' => in_array($post->id, $bookmarkedIds, true),
            'poll'       => $post->poll ? $post->poll->serialize($viewerId) : null,
            'author'     => [
                'id'        => $u?->id,
                'name'      => $u?->display_name ?: $u?->name,
                'gameNick'  => $summoner && $tag ? "{$summoner}#{$tag}" : ($summoner ?: ''),
                'avatarSrc' => $u?->avatar_src,
            ],
        ];
    }
}

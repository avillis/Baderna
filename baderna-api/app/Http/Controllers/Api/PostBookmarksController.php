<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostBookmark;
use App\Models\PostLike;
use Illuminate\Http\Request;

class PostBookmarksController extends Controller
{
    /** Toggle bookmark. Returns { bookmarked: bool }. */
    public function toggle(Request $request, int $postId)
    {
        $userId   = $request->user()->id;
        $existing = PostBookmark::where('user_id', $userId)->where('post_id', $postId)->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['bookmarked' => false]);
        }

        PostBookmark::create(['user_id' => $userId, 'post_id' => $postId]);
        return response()->json(['bookmarked' => true]);
    }

    /** List all bookmarked posts (same shape as feed). */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $bookmarkedIds = PostBookmark::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->pluck('post_id');

        if ($bookmarkedIds->isEmpty()) {
            return response()->json(['posts' => []]);
        }

        $posts = Post::with(['user:id,name,display_name,summoner_name,tagLine,avatar_src'])
            ->withCount(['likes', 'comments'])
            ->whereIn('id', $bookmarkedIds)
            ->orderByDesc('id')
            ->get();

        $likedIds = PostLike::where('user_id', $userId)
            ->whereIn('post_id', $posts->pluck('id'))
            ->pluck('post_id')
            ->toArray();

        return response()->json([
            'posts' => $posts->map(fn($p) => $this->serialize($p, $likedIds, $bookmarkedIds->toArray())),
        ]);
    }

    private function serialize(Post $post, array $likedIds, array $bookmarkedIds): array
    {
        $u = $post->user;
        $summoner = $u?->summoner_name ?? '';
        $tag      = $u?->tagLine ?? '';
        return [
            'id'            => $post->id,
            'shortCode'     => $post->short_code,
            'content'       => $post->content,
            'imageUrl'      => $post->image_url,
            'gifUrl'        => $post->gif_url,
            'videoUrl'      => $post->video_url,
            'createdAt'     => $post->created_at?->toIso8601String(),
            'likesCount'    => $post->likes_count ?? 0,
            'commentsCount' => $post->comments_count ?? 0,
            'liked'         => in_array($post->id, $likedIds, true),
            'bookmarked'    => in_array($post->id, $bookmarkedIds, true),
            'author'        => [
                'id'        => $u?->id,
                'name'      => $u?->display_name ?: $u?->name,
                'gameNick'  => $summoner && $tag ? "{$summoner}#{$tag}" : ($summoner ?: ''),
                'avatarSrc' => $u?->avatar_src,
            ],
        ];
    }
}

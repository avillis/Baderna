<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LinkPreviewController extends Controller
{
    private const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    public function show(Request $request)
    {
        $url = $request->query('url', '');
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return response()->json(['error' => 'URL inválida.'], 422);
        }

        // Bloqueia IPs privados / localhost (SSRF protection)
        $host = parse_url($url, PHP_URL_HOST);
        if (!$host || preg_match('/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/', $host)) {
            return response()->json(['error' => 'URL não permitida.'], 422);
        }

        try {
            // TikTok: oEmbed API (free, no auth needed, returns thumbnail_url)
            if (preg_match('/tiktok\.com/i', $host)) {
                return $this->tiktokPreview($url);
            }

            // YouTube: oEmbed API (also free)
            if (preg_match('/youtube\.com|youtu\.be/i', $host)) {
                return $this->youtubePreview($url);
            }

            $response = Http::timeout(8)
                ->withHeaders(['User-Agent' => self::CHROME_UA])
                ->get($url);

            if (!$response->successful()) {
                return response()->json(['error' => 'Não foi possível carregar a URL.'], 422);
            }

            $html = $response->body();
            $data = [
                'url'         => $url,
                'title'       => $this->getMeta($html, 'og:title') ?? $this->getTitle($html),
                'description' => $this->getMeta($html, 'og:description') ?? $this->getMeta($html, 'description'),
                'image'       => $this->getMeta($html, 'og:image'),
                'siteName'    => $this->getMeta($html, 'og:site_name') ?? $host,
            ];

            if (!$data['title'] && !$data['image']) {
                return response()->json(['error' => 'Sem dados de preview.'], 422);
            }

            return response()->json($data);
        } catch (\Throwable) {
            return response()->json(['error' => 'Erro ao buscar preview.'], 422);
        }
    }

    /** TikTok oEmbed — resolves vt.tiktok.com short links first. */
    private function tiktokPreview(string $url): \Illuminate\Http\JsonResponse
    {
        $resolved = $url;

        // Short links (vt.tiktok.com) don't have /video/ in them — follow redirects to get full URL
        if (!str_contains($url, '/video/')) {
            try {
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_USERAGENT      => self::CHROME_UA,
                    CURLOPT_NOBODY         => true,   // HEAD only — we just need the final URL
                    CURLOPT_TIMEOUT        => 5,
                    CURLOPT_SSL_VERIFYPEER => false,
                ]);
                curl_exec($ch);
                $resolved = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL) ?: $url;
                curl_close($ch);
            } catch (\Throwable) {}
        }

        try {
            $oembed = Http::timeout(5)
                ->withHeaders(['User-Agent' => self::CHROME_UA])
                ->get('https://www.tiktok.com/oembed', ['url' => $resolved]);

            if ($oembed->successful()) {
                $d = $oembed->json();
                return response()->json([
                    'url'         => $url,
                    'title'       => $d['title'] ?? null,
                    'description' => null,
                    'image'       => $d['thumbnail_url'] ?? null,
                    'siteName'    => 'TikTok',
                ]);
            }
        } catch (\Throwable) {}

        return response()->json(['error' => 'Sem dados de preview.'], 422);
    }

    /** YouTube oEmbed — works for regular videos and Shorts. */
    private function youtubePreview(string $url): \Illuminate\Http\JsonResponse
    {
        try {
            $oembed = Http::timeout(5)
                ->get('https://www.youtube.com/oembed', ['url' => $url, 'format' => 'json']);

            if ($oembed->successful()) {
                $d = $oembed->json();
                return response()->json([
                    'url'         => $url,
                    'title'       => $d['title'] ?? null,
                    'description' => null,
                    'image'       => $d['thumbnail_url'] ?? null,
                    'siteName'    => 'YouTube',
                ]);
            }
        } catch (\Throwable) {}

        return response()->json(['error' => 'Sem dados de preview.'], 422);
    }

    private function getMeta(string $html, string $property): ?string
    {
        // og: tags (property attr)
        if (preg_match('/<meta[^>]+property=["\']' . preg_quote($property, '/') . '["\'][^>]+content=["\'](.*?)["\'][^>]*>/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES));
        }
        // name= attr (for description etc)
        if (preg_match('/<meta[^>]+name=["\']' . preg_quote($property, '/') . '["\'][^>]+content=["\'](.*?)["\'][^>]*>/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES));
        }
        // reversed attr order
        if (preg_match('/<meta[^>]+content=["\'](.*?)["\'][^>]+property=["\']' . preg_quote($property, '/') . '["\'][^>]*>/i', $html, $m)) {
            return trim(html_entity_decode($m[1], ENT_QUOTES));
        }
        return null;
    }

    private function getTitle(string $html): ?string
    {
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $m)) {
            return trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES));
        }
        return null;
    }
}

<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LinkPreviewController extends Controller
{
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
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; BadernBot/1.0)'])
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

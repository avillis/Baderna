<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AvatarUploadController extends Controller
{
    /**
     * Recebe um arquivo de imagem e devolve URL pública absoluta.
     * Storage em disk 'public' → /storage/avatars/{filename}.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|mimes:png,jpg,jpeg,webp,gif|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('file');

        $owner = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($user->summoner_name ?? 'user'));
        $owner = substr($owner, 0, 32) ?: 'user';
        // Extensão derivada do MIME real (não do client) pra evitar arquivos
        // tipo .html/.php servindo XSS no domínio da API.
        $ext = $this->extFromMime($file->getMimeType());
        $filename = $owner . '-' . time() . '.' . $ext;

        $path = $file->storeAs('avatars', $filename, 'public');

        return response()->json([
            'url' => url(Storage::url($path)),
        ]);
    }

    private function extFromMime(?string $mime): string
    {
        return match ($mime) {
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            default      => 'jpg', // image/jpeg + fallback
        };
    }
}

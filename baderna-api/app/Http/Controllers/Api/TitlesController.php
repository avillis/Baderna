<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Title;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TitlesController extends Controller
{
    /**
     * Lista todos os títulos (não removidos). O front mistura com os defaults
     * do código e usa o slug como identificador estável.
     */
    public function index()
    {
        return response()->json(
            Title::where('removed', false)
                ->orderBy('id')
                ->get(['slug', 'label', 'rarity', 'created_by_user_id', 'created_at'])
        );
    }

    /**
     * Cria um título customizado. Apenas admins.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'label'  => 'required|string|max:60',
            'rarity' => 'required|string|in:limitado,lendaria,exclusivo,epico,raro,comum',
        ]);

        $baseSlug = Str::slug($data['label']) ?: 'titulo';
        $slug = $baseSlug;
        $i = 1;
        while (Title::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . (++$i);
        }

        $title = Title::create([
            'slug'               => $slug,
            'label'              => $data['label'],
            'rarity'             => $data['rarity'],
            'removed'            => false,
            'created_by_user_id' => $request->user()->id,
        ]);

        return response()->json($title, 201);
    }

    /**
     * Marca um título como removido (soft delete via flag). Defaults também
     * podem ser "escondidos" assim — a flag é o source-of-truth.
     */
    public function destroy(string $slug)
    {
        $title = Title::where('slug', $slug)->firstOrFail();
        $title->update(['removed' => true]);
        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberUnlock;
use Illuminate\Http\Request;

class MemberUnlocksController extends Controller
{
    private const KINDS = ['title', 'capa', 'name'];

    /**
     * Lista todos os unlocks do usuário logado.
     * Resposta: { title: [...slugs], capa: [...], name: [...] }
     */
    public function index(Request $request)
    {
        $rows = $request->user()->memberUnlocks()->get(['kind', 'slug']);
        $out = ['title' => [], 'capa' => [], 'name' => []];
        foreach ($rows as $r) {
            $out[$r->kind][] = $r->slug;
        }
        return response()->json($out);
    }

    /**
     * Adiciona um unlock pro próprio usuário (compra na loja).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => 'required|string|in:' . implode(',', self::KINDS),
            'slug' => 'required|string|max:120',
        ]);

        MemberUnlock::firstOrCreate([
            'user_id' => $request->user()->id,
            'kind'    => $data['kind'],
            'slug'    => $data['slug'],
        ]);

        return response()->json($data, 201);
    }

    /**
     * Admin lista todos os unlocks de qualquer membro.
     */
    public function adminIndex(int $user)
    {
        $rows = MemberUnlock::where('user_id', $user)->get(['kind', 'slug']);
        $out = ['title' => [], 'capa' => [], 'name' => []];
        foreach ($rows as $r) {
            $out[$r->kind][] = $r->slug;
        }
        return response()->json($out);
    }

    /**
     * Admin pode conceder unlocks pra qualquer membro (member id = user_id).
     */
    public function adminGrant(Request $request, int $user)
    {
        $data = $request->validate([
            'kind' => 'required|string|in:' . implode(',', self::KINDS),
            'slug' => 'required|string|max:120',
        ]);

        MemberUnlock::firstOrCreate([
            'user_id' => $user,
            'kind'    => $data['kind'],
            'slug'    => $data['slug'],
        ]);

        return response()->json($data, 201);
    }

    /**
     * Admin pode também revogar.
     */
    public function adminRevoke(int $user, string $kind, string $slug)
    {
        MemberUnlock::where('user_id', $user)
            ->where('kind', $kind)
            ->where('slug', $slug)
            ->delete();
        return response()->json(null, 204);
    }
}

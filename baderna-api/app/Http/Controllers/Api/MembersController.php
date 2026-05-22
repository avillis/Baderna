<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MembersController extends Controller
{
    /**
     * Slug usado nas URLs (/membro/{slug}). Bate com getMemberSlug do front:
     * lowercase + espaços viram hífen.
     */
    private function slugify(?string $nick, int $userId): string
    {
        if (!$nick) return (string)$userId;
        $trimmed = trim($nick);
        // Transliterate (acentos) + strip de CJK/símbolos. Tem que bater
        // com getMemberSlug do front.
        $ascii = @transliterator_transliterate('Any-Latin; Latin-ASCII;', $trimmed);
        if (!$ascii) $ascii = $trimmed;
        $lower = strtolower($ascii);
        $cleaned = preg_replace('/[^a-z0-9\s-]/', '', $lower) ?? '';
        $hyphenated = preg_replace('/\s+/', '-', $cleaned) ?? '';
        $dedupHyphen = preg_replace('/-+/', '-', $hyphenated) ?? '';
        $slug = trim($dedupHyphen, '-');
        return $slug !== '' ? $slug : (string)$userId;
    }

    /**
     * Lista todos os usuários cadastrados (não-deletados). Usado pelos
     * componentes que listam membros (Inhouse builder, página /membros, etc).
     */
    public function index()
    {
        $users = User::where('is_deleted', false)
            ->orderBy('id')
            ->get();

        return response()->json($users->map(function ($u) {
            $nick = $u->summoner_name ?: $u->name;
            return [
                'id'              => $this->slugify($nick, $u->id),
                'userId'          => $u->id,
                'name'            => $u->display_name ?: $u->name,
                'nickname'        => $nick,
                'summonerName'    => $u->summoner_name,
                'tagLine'         => $u->tagLine,
                'avatarSrc'       => $u->avatar_src,
                'bannerFileName'  => $u->banner_filename,
                'isAdmin'         => (bool)$u->is_admin,
                'bio'             => $u->bio,
                'teamName'        => $u->team_name,
                'primaryLane'     => $u->primary_lane,
                'secondaryLane'   => $u->secondary_lane,
                'activeNameId'    => $u->active_name_id,
            ];
        }));
    }

    /**
     * Admin cria um "stub" de conta com nome + summoner + tag. Quando o membro
     * fizer o register com o mesmo summoner+tag, a conta vai ser reivindicada
     * (email/password preenchidos).
     */
    public function adminStore(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:120',
            'summoner_name' => 'required|string|max:32',
            'tagLine'       => 'required|string|max:8',
        ]);

        // Bloqueia duplicação por summoner+tag
        $existing = User::where('summoner_name', $data['summoner_name'])
            ->where('tagLine', $data['tagLine'])
            ->first();
        if ($existing) {
            throw ValidationException::withMessages([
                'summoner_name' => ['Já existe um membro com esse nick + tag.'],
            ]);
        }

        // Email placeholder único — quando reivindicar, o real entra.
        $placeholderEmail = 'pending-' . Str::lower(Str::random(10)) . '@pending.baderna';

        $user = User::create([
            'name'                  => $data['name'],
            'email'                 => $placeholderEmail,
            'password'              => Hash::make(Str::random(24)),
            'summoner_name'         => $data['summoner_name'],
            'tagLine'               => $data['tagLine'],
            'pending_registration'  => true,
            'is_admin'              => false,
        ]);

        return response()->json([
            'id'           => $this->slugify($user->summoner_name, $user->id),
            'userId'       => $user->id,
            'name'         => $user->name,
            'nickname'     => $user->summoner_name,
            'summonerName' => $user->summoner_name,
            'tagLine'      => $user->tagLine,
            'pending'      => true,
        ], 201);
    }

    /**
     * Admin marca um usuário como "deletado" (tombstone — não some do DB).
     */
    public function softDelete(Request $request, User $user)
    {
        $user->update(['is_deleted' => true]);
        return response()->json(null, 204);
    }

    /**
     * Admin promove/rebaixa cargo de outro user. Bloqueia tentar mexer no
     * próprio cargo (segurança — evita admin único se demitir por engano).
     */
    public function setRole(Request $request, User $user)
    {
        $data = $request->validate([
            'is_admin' => 'required|boolean',
        ]);

        if ($request->user()->id === $user->id) {
            return response()->json(
                ['message' => 'Você não pode alterar seu próprio cargo.'],
                422,
            );
        }

        $user->update(['is_admin' => $data['is_admin']]);
        return response()->json([
            'id' => $user->id,
            'isAdmin' => (bool)$user->is_admin,
        ]);
    }

    /**
     * Admin restaura um usuário deletado.
     */
    public function restore(Request $request, User $user)
    {
        $user->update(['is_deleted' => false]);
        return response()->json(null, 204);
    }
}

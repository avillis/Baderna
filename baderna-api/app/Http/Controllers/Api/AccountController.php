<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Retorna o "account" do usuário logado — os campos que o front editava
     * em Minha Conta. Inclui o que viver em users (bio, team_name, etc) e os
     * derivados do summoner.
     */
    public function show(Request $request)
    {
        return response()->json($this->serialize($request->user()));
    }

    /**
     * Atualiza os campos editáveis em Minha Conta.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'display_name'       => 'sometimes|nullable|string|max:80',
            'bio'                => 'sometimes|nullable|string|max:300',
            'team_name'          => 'sometimes|nullable|string|max:80',
            'avatar_src'         => 'sometimes|nullable|string|max:255',
            'banner_filename'    => 'sometimes|nullable|string|max:255',
            'email'              => 'sometimes|nullable|email|max:255',
            'summoner_name'      => 'sometimes|nullable|string|max:32',
            'tagLine'            => 'sometimes|nullable|string|max:8',
            'active_name_id'     => 'sometimes|nullable|string|max:32',
            'active_title_slugs' => 'sometimes|nullable|array',
            'active_title_slugs.*' => 'string|max:80',
            'primary_lane'       => 'sometimes|nullable|string|in:TOP,JG,MID,ADC,SUP',
            'secondary_lane'     => 'sometimes|nullable|string|in:TOP,JG,MID,ADC,SUP',
        ]);

        $user = $request->user();
        $user->fill($data);
        $user->save();

        return response()->json($this->serialize($user->fresh()));
    }

    private function serialize($user): array
    {
        $summoner = $user->summoner_name ?? '';
        $tag = $user->tagLine ?? '';
        $gameNick = $summoner && $tag ? "{$summoner}#{$tag}" : '';
        $nick = $summoner ?: ($user->name ?? '');

        return [
            'id'                 => $user->id,
            'name'               => $user->display_name ?: $user->name,
            'gameNick'           => $gameNick,
            'bio'                => $user->bio ?? '',
            'teamName'           => $user->team_name ?: ($nick ? "Time {$nick}" : ''),
            'avatarSrc'          => $user->avatar_src ?? '',
            'bannerFileName'     => $user->banner_filename ?? '',
            'email'              => $user->email,
            'activeNameId'       => $user->active_name_id ?? 'preto',
            'activeTitleSlugs'   => $user->active_title_slugs ?? ['aprendiz'],
            'primaryLane'        => $user->primary_lane,
            'secondaryLane'      => $user->secondary_lane,
        ];
    }
}

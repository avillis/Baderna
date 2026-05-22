<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RiotAPIServices;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Retorna o "account" do usuário logado — os campos que o front editava
     * em Minha Conta. Inclui o que viver em users (bio, team_name, etc) e os
     * derivados do summoner.
     *
     * Backfill lazy: se o user ainda não tem profile_icon_id mas tem PUUID,
     * busca da Riot uma vez. Migra contas antigas pro novo fluxo.
     */
    public function show(Request $request, RiotAPIServices $riot)
    {
        $user = $request->user();
        $this->backfillRiotIcon($user, $riot);
        return response()->json($this->serialize($user, $riot));
    }

    /**
     * Atualiza os campos editáveis em Minha Conta.
     */
    public function update(Request $request, RiotAPIServices $riot)
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
        $changedRiotId =
            (isset($data['summoner_name']) && $data['summoner_name'] !== $user->summoner_name) ||
            (isset($data['tagLine']) && $data['tagLine'] !== $user->tagLine);
        $user->fill($data);
        $user->save();

        // Trocou nick ou tag → resolve PUUID + ícone na Riot e atualiza.
        if ($changedRiotId && $user->summoner_name && $user->tagLine) {
            try {
                $account = $riot->getPlayerPUUIDByRiotId($user->summoner_name, $user->tagLine);
                if (!empty($account['puuid'])) {
                    $user->riot_puuid = $account['puuid'];
                    $user->summoner_name = $account['gameName'] ?? $user->summoner_name;
                    $user->tagLine = $account['tagLine'] ?? $user->tagLine;
                    $summoner = $riot->getSummonerByPUUID($user->riot_puuid);
                    $iconId = $summoner['profileIconId'] ?? null;
                    if ($iconId) {
                        $user->profile_icon_id = $iconId;
                        $user->avatar_src = $riot->profileIconUrl($iconId);
                    }
                    $user->save();
                }
            } catch (\Throwable $e) {
                /* mantém o que tinha */
            }
        }

        return response()->json($this->serialize($user->fresh(), $riot));
    }

    /**
     * Busca da Riot e salva o profile_icon_id e avatar_src do user logado,
     * se ainda não estiverem preenchidos. Idempotente — só roda uma vez.
     */
    private function backfillRiotIcon($user, RiotAPIServices $riot): void
    {
        if ($user->profile_icon_id || !$user->riot_puuid) return;
        try {
            $summoner = $riot->getSummonerByPUUID($user->riot_puuid);
            $iconId   = $summoner['profileIconId'] ?? null;
            if (!$iconId) return;
            $user->profile_icon_id = $iconId;
            // Só preenche avatar_src se ainda estiver vazio (não sobrescreve
            // escolha do user).
            if (!$user->avatar_src) {
                $user->avatar_src = $riot->profileIconUrl($iconId);
            }
            $user->save();
        } catch (\Throwable $e) {
            /* segue */
        }
    }

    private function serialize($user, RiotAPIServices $riot): array
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
            // URL do ícone Riot atual (Data Dragon). Independente do avatarSrc
            // — assim o user pode voltar a usar o ícone Riot mesmo se trocou
            // pra champion/upload.
            'riotIconUrl'        => $user->profile_icon_id
                ? $riot->profileIconUrl($user->profile_icon_id)
                : null,
        ];
    }
}

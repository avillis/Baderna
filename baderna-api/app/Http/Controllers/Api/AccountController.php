<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RiotAPIServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
        $user = $request->user();
        $data = $request->validate([
            'display_name'       => 'sometimes|nullable|string|max:80',
            'slug'               => [
                'sometimes',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9][a-z0-9-]*[a-z0-9]$/',
                'unique:users,slug,' . $user->id,
            ],
            'bio'                => 'sometimes|nullable|string|max:300',
            'team_name'          => 'sometimes|nullable|string|max:80',
            'avatar_src'         => 'sometimes|nullable|string|max:255',
            'banner_filename'    => 'sometimes|nullable|string|max:255',
            'banner_focus_y'     => 'sometimes|integer|min:0|max:100',
            'email'              => 'sometimes|nullable|email|max:255',
            'summoner_name'      => 'sometimes|nullable|string|max:32',
            'tagLine'            => 'sometimes|nullable|string|max:8',
            'active_name_id'     => 'sometimes|nullable|string|max:32',
            'active_title_slugs' => 'sometimes|nullable|array',
            'active_title_slugs.*' => 'string|max:80',
            'primary_lane'       => 'sometimes|nullable|string|in:TOP,JG,MID,ADC,SUP',
            'secondary_lane'     => 'sometimes|nullable|string|in:TOP,JG,MID,ADC,SUP',
            // Destaque é admin-only: ignorado aqui no update do próprio user.
            // Setado via endpoint admin dedicado (a fazer).
            'profile_module_order' => 'sometimes|nullable|array',
            'profile_module_order.*' => 'string|max:40',
            'favorite_champion_slugs' => 'sometimes|nullable|array',
            'favorite_champion_slugs.*' => 'string|max:80',
            'favorite_game_title' => 'sometimes|nullable|string|max:120',
            'favorite_game_cover_url' => 'sometimes|nullable|string|max:255',
            'duo_user_id'        => 'sometimes|nullable|integer|exists:users,id',
            'birthday'           => 'sometimes|nullable|date',
            'birthday_hidden'    => 'sometimes|boolean',
            'favorite_song_spotify_id' => 'sometimes|nullable|string|max:64',
            'favorite_song_name'       => 'sometimes|nullable|string|max:255',
            'favorite_song_artist'     => 'sometimes|nullable|string|max:255',
            'favorite_song_image'      => 'sometimes|nullable|string|max:255',
            'favorite_song_url'        => 'sometimes|nullable|string|max:255',
        ]);

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

    /**
     * Troca a senha do usuário logado. Exige senha atual pra evitar troca
     * por sessão sequestrada. Rate-limit pra brute-force.
     */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|max:200',
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Senha atual incorreta.'],
            ]);
        }

        $user->password = Hash::make($data['new_password']);
        $user->save();

        return response()->json(['ok' => true]);
    }

    private function serialize($user, RiotAPIServices $riot): array
    {
        $summoner = $user->summoner_name ?? '';
        $tag = $user->tagLine ?? '';
        $gameNick = $summoner && $tag ? "{$summoner}#{$tag}" : '';
        $nick = $summoner ?: ($user->name ?? '');

        return [
            'id'                 => $user->id,
            'slug'               => $user->slug,
            'name'               => $user->display_name ?: $user->name,
            'gameNick'           => $gameNick,
            'bio'                => $user->bio ?? '',
            'teamName'           => $user->team_name ?: ($nick ? "Time {$nick}" : ''),
            'avatarSrc'          => $user->avatar_src ?? '',
            'bannerFileName'     => $user->banner_filename ?? '',
            'bannerFocusY'       => (int)($user->banner_focus_y ?? 16),
            'email'              => $user->email,
            'activeNameId'       => $user->active_name_id ?? 'preto',
            'activeTitleSlugs'   => $user->active_title_slugs ?? ['aprendiz'],
            'primaryLane'        => $user->primary_lane,
            'secondaryLane'      => $user->secondary_lane,
            'communityHighlight' => $user->community_highlight,
            'profileModuleOrder' => $user->profile_module_order ?? [],
            'favoriteChampionSlugs' => $user->favorite_champion_slugs ?? [],
            'favoriteGameTitle'  => $user->favorite_game_title,
            'favoriteGameCoverUrl' => $user->favorite_game_cover_url,
            'duoUserId'          => $user->duo_user_id,
            'birthday'           => $user->birthday ? \Carbon\Carbon::parse($user->birthday)->toDateString() : null,
            'birthdayHidden'     => (bool) ($user->birthday_hidden ?? false),
            'memberSince'        => optional($user->created_at)->toIso8601String(),
            // URL do ícone Riot atual (Data Dragon). Independente do avatarSrc
            // — assim o user pode voltar a usar o ícone Riot mesmo se trocou
            // pra champion/upload.
            'riotIconUrl'        => $user->profile_icon_id
                ? $riot->profileIconUrl($user->profile_icon_id)
                : null,
            'favoriteSongId'     => $user->favorite_song_spotify_id,
            'favoriteSongName'   => $user->favorite_song_name,
            'favoriteSongArtist' => $user->favorite_song_artist,
            'favoriteSongImage'  => $user->favorite_song_image,
            'favoriteSongUrl'    => $user->favorite_song_url,
        ];
    }
}

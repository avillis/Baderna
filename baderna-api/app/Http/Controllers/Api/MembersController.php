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
     * lowercase + espaços viram hífen. Só usado como fallback enquanto a
     * coluna users.slug não foi populada (backfill).
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
    public function index(Request $request)
    {
        $users = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->withCount([
                'posts as postsCount',
                'authoredComments as authoredCommentsCount',
                'profileComments as profileCommentsCount',
                'memberUnlocks as unlockedTitlesCount' => fn ($q) => $q->where('kind', 'title'),
                'memberUnlocks as unlockedBannersCount' => fn ($q) => $q->where('kind', 'capa'),
                'memberUnlocks as unlockedNamesCount' => fn ($q) => $q->where('kind', 'name'),
            ])
            ->orderBy('id')
            ->get();

        // isAdmin é privacy-sensitive: só serializa pra quem JÁ é admin
        // (admin members-table, badge "Admin" no inhouse-builder pra admins).
        // Pra anônimos e membros normais, o campo nem aparece na resposta.
        $viewerIsAdmin = $request->user() && $request->user()->is_admin;

        // ── Baderna Points (BP) — ranking interno, derivado AO VIVO ──────────
        // Flex: vitórias/derrotas vêm do ledger flex_match_credits (mesma fonte
        // que credita moedas, já com dedup por partida). Inhouse: contadas dos
        // próprios inhouses com vencedor definido. Como é derivado, mudar a
        // config de pontos no admin recalcula o ranking inteiro na hora.
        $bp = \App\Models\AppSetting::get('inhouse_points', [
            'flex'    => ['win' => 10, 'loss' => 5],
            'inhouse' => ['win' => 25, 'loss' => 15],
        ]);
        $fW = (int)($bp['flex']['win'] ?? 0);
        $fL = (int)($bp['flex']['loss'] ?? 0);
        $iW = (int)($bp['inhouse']['win'] ?? 0);
        $iL = (int)($bp['inhouse']['loss'] ?? 0);

        // Flex agregado por user_id. CASE WHEN em vez de SUM(boolean), que o
        // Postgres rejeita.
        $flexAgg = \App\Models\FlexMatchCredit::selectRaw(
            'user_id,
             SUM(CASE WHEN is_win THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN is_win THEN 0 ELSE 1 END) AS losses'
        )->groupBy('user_id')->get()->keyBy('user_id');

        // Inhouse contado por slug do player (payload.players[].id == users.slug),
        // só nos que já têm vencedor.
        $inhouseTally = [];
        foreach (\App\Models\Inhouse::all() as $ih) {
            $payload = is_array($ih->payload) ? $ih->payload : [];
            $winner = $payload['winner'] ?? null;
            if (!in_array($winner, ['blue', 'red'], true)) continue;
            foreach (($payload['players'] ?? []) as $p) {
                $side = is_array($p) ? ($p['side'] ?? null) : null;
                $pslug = is_array($p) ? ($p['id'] ?? null) : null;
                if (!$pslug || !in_array($side, ['blue', 'red'], true)) continue;
                if (!isset($inhouseTally[$pslug])) {
                    $inhouseTally[$pslug] = ['wins' => 0, 'losses' => 0];
                }
                if ($side === $winner) $inhouseTally[$pslug]['wins']++;
                else $inhouseTally[$pslug]['losses']++;
            }
        }

        $rows = $users->map(function ($u) use ($viewerIsAdmin, $fW, $fL, $iW, $iL, $flexAgg, $inhouseTally) {
            $nick = $u->summoner_name ?: $u->name;
            $slug = $u->slug ?: $this->slugify($nick, $u->id);

            $flex = $flexAgg->get($u->id);
            $flexW = (int)($flex->wins ?? 0);
            $flexL = (int)($flex->losses ?? 0);
            $ih = $inhouseTally[$slug] ?? ['wins' => 0, 'losses' => 0];
            $badernaPoints = $flexW * $fW + $flexL * $fL
                + $ih['wins'] * $iW + $ih['losses'] * $iL;

            $row = [
                'id'              => $slug,
                'userId'          => $u->id,
                'badernaPoints'   => $badernaPoints,
                'name'            => $u->display_name ?: $u->name,
                'nickname'        => $nick,
                'summonerName'    => $u->summoner_name,
                'tagLine'         => $u->tagLine,
                'avatarSrc'       => $u->avatar_src,
                'bannerFileName'  => $u->banner_filename,
                'bannerFocusY'    => (int)($u->banner_focus_y ?? 16),
                'bio'             => $u->bio,
                'teamName'        => $u->team_name,
                'primaryLane'     => $u->primary_lane,
                'secondaryLane'   => $u->secondary_lane,
                'communityHighlight' => $u->community_highlight,
                'profileModuleOrder' => $u->profile_module_order ?? [],
                'favoriteChampionSlugs' => $u->favorite_champion_slugs ?? [],
                'favoriteGameTitle' => $u->favorite_game_title,
                'favoriteGameCoverUrl' => $u->favorite_game_cover_url,
                'duoUserId'       => $u->duo_user_id,
                'pinnedPostId'    => $u->pinned_post_id,
                'memberSince'     => optional($u->created_at)->toIso8601String(),
                'activeNameId'    => $u->active_name_id,
                'activeTitleSlugs' => $u->active_title_slugs ?? ['aprendiz'],
                'favoriteSongId'      => $u->favorite_song_spotify_id,
                'favoriteSongName'    => $u->favorite_song_name,
                'favoriteSongArtist'  => $u->favorite_song_artist,
                'favoriteSongImage'   => $u->favorite_song_image,
                'favoriteSongUrl'     => $u->favorite_song_url,
                'cachedRankTier'      => $u->cached_rank_tier,
                'cachedRankDivision'  => $u->cached_rank_division,
                'cachedRankLp'        => $u->cached_rank_lp,
                'postsCount'      => (int)($u->postsCount ?? 0),
                'authoredCommentsCount' => (int)($u->authoredCommentsCount ?? 0),
                'profileCommentsCount' => (int)($u->profileCommentsCount ?? 0),
                'unlockedTitlesCount' => (int)($u->unlockedTitlesCount ?? 0),
                'unlockedBannersCount' => (int)($u->unlockedBannersCount ?? 0),
                'unlockedNamesCount' => (int)($u->unlockedNamesCount ?? 0),
            ];
            if ($viewerIsAdmin) {
                $row['isAdmin'] = (bool)$u->is_admin;
                $row['isOwner'] = (bool)$u->is_owner;
            }
            return $row;
        });

        // Ranking da Baderna = ordem por BP (desc). Desempate por ordem de
        // criação (userId asc) pra ficar estável. Esse índice vira o #NN
        // mostrado no site todo (card do membro, perfil, cards de inhouse).
        $sorted = $rows->sort(function ($a, $b) {
            return ($b['badernaPoints'] <=> $a['badernaPoints'])
                ?: ($a['userId'] <=> $b['userId']);
        })->values();

        return response()->json($sorted);
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
            'approval_status'       => 'approved',
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

    /**
     * Cadastros aguardando decisão do admin (pendentes) + rejeitados (pra
     * reverter). Consumido pelo card de aprovações no painel admin.
     */
    public function pending(Request $request)
    {
        $users = User::whereIn('approval_status', ['pending', 'rejected'])
            ->where('is_deleted', false)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($users->map(fn ($u) => [
            'userId'         => $u->id,
            'name'           => $u->display_name ?: $u->name,
            'nickname'       => $u->summoner_name ?: $u->name,
            'summonerName'   => $u->summoner_name,
            'tagLine'        => $u->tagLine,
            'email'          => $u->email,
            'avatarSrc'      => $u->avatar_src,
            'approvalStatus' => $u->approval_status,
            'createdAt'      => optional($u->created_at)->toIso8601String(),
        ]));
    }

    /**
     * Admin aprova um cadastro pendente — passa a poder logar e aparece na
     * comunidade.
     */
    public function approve(Request $request, User $user)
    {
        $user->update(['approval_status' => 'approved']);
        return response()->json(['message' => 'Conta aprovada.']);
    }

    /**
     * Admin rejeita um cadastro — login fica bloqueado.
     */
    public function reject(Request $request, User $user)
    {
        $user->update(['approval_status' => 'rejected']);
        return response()->json(['message' => 'Conta rejeitada.']);
    }
}

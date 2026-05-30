<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\FlexMatchCredit;
use App\Models\Inhouse;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Log do Rank da Baderna (BP).
 *
 * NÃO altera nada: é uma LEITURA que reusa a mesma fórmula de
 * MembersController::index() (Flex via flex_match_credits + Inhouse via
 * payload dos inhouses com vencedor) pra os números baterem com o #NN do
 * site. Além do somatório por membro, devolve a timeline de eventos
 * (cada vitória/derrota, quanto deu de BP e quando).
 *
 *   - index()        — admin: log de TODOS os membros.
 *   - forUser($id)   — qualquer logado: log de UM membro (modal do perfil).
 */
class BadernaPointsLogController extends Controller
{
    /**
     * Slug usado nas URLs (/membro/{slug}). Cópia da regra do
     * MembersController pra casar payload.players[].id (slug) com o user.
     */
    private function slugify(?string $nick, int $userId): string
    {
        if (!$nick) return (string)$userId;
        $trimmed = trim($nick);
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
     * Calcula config + linhas (resumo + timeline) de todos os membros.
     * Retorna ['config' => [...], 'rows' => Collection].
     */
    private function computeRows(): array
    {
        $users = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->orderBy('id')
            ->get();

        // Config de pontos (mesma fonte que MembersController).
        $bp = AppSetting::get('inhouse_points', [
            'flex'    => ['win' => 10, 'loss' => 5],
            'inhouse' => ['win' => 25, 'loss' => 15],
        ]);
        $fW = (int)($bp['flex']['win'] ?? 0);
        $fL = (int)($bp['flex']['loss'] ?? 0);
        $iW = (int)($bp['inhouse']['win'] ?? 0);
        $iL = (int)($bp['inhouse']['loss'] ?? 0);

        // slug -> userId (pra casar players do inhouse com membros).
        $slugToUserId = [];
        $teamNameByUserId = [];
        foreach ($users as $u) {
            $nick = $u->summoner_name ?: $u->name;
            $slug = $u->slug ?: $this->slugify($nick, $u->id);
            $slugToUserId[$slug] = $u->id;
            // Nome do time custom (definido em Minha Conta). Mesma regra do
            // inhouse-lobby: usa o team_name se existir e não for o default
            // "Time {nick}", senão cai pro "Time {nick}".
            $custom = trim((string)($u->team_name ?? ''));
            $teamNameByUserId[$u->id] =
                ($custom !== '' && $custom !== "Time {$nick}")
                    ? $custom
                    : "Time {$nick}";
        }

        // Eventos Flex por user (1 por partida creditada), mais recente 1o.
        $flexByUser = [];
        $flexAgg = [];
        foreach (FlexMatchCredit::orderByDesc('created_at')->get() as $c) {
            $uid = $c->user_id;
            $win = (bool)$c->is_win;
            $evBp = $win ? $fW : $fL;
            $flexByUser[$uid][] = [
                'type'    => 'flex',
                'result'  => $win ? 'win' : 'loss',
                'bp'      => $evBp,
                'date'    => optional($c->created_at)->toIso8601String(),
                'matchId' => $c->match_id,
            ];
            if (!isset($flexAgg[$uid])) $flexAgg[$uid] = ['wins' => 0, 'losses' => 0];
            if ($win) $flexAgg[$uid]['wins']++; else $flexAgg[$uid]['losses']++;
        }

        // Eventos Inhouse por user (a partir dos inhouses com vencedor).
        $inhouseByUser = [];
        $inhouseAgg = [];
        foreach (Inhouse::orderByDesc('updated_at')->get() as $ih) {
            $payload = is_array($ih->payload) ? $ih->payload : [];
            $winner = $payload['winner'] ?? null;
            if (!in_array($winner, ['blue', 'red'], true)) continue;

            $when = optional($ih->updated_at ?? $ih->created_at)->toIso8601String();
            // Rótulo do time = nome custom do líder (team_name de Minha Conta),
            // com fallback "Time {nick}".
            $blueLeaderSlug = $payload['blueLeaderId'] ?? null;
            $redLeaderSlug  = $payload['redLeaderId'] ?? null;
            $teamLabelFor = function (string $side) use ($blueLeaderSlug, $redLeaderSlug, $slugToUserId, $teamNameByUserId) {
                $leaderSlug = $side === 'blue' ? $blueLeaderSlug : $redLeaderSlug;
                if ($leaderSlug && isset($slugToUserId[$leaderSlug])) {
                    $leaderUid = $slugToUserId[$leaderSlug];
                    return $teamNameByUserId[$leaderUid] ?? ($side === 'blue' ? 'Time Azul' : 'Time Vermelho');
                }
                return $side === 'blue' ? 'Time Azul' : 'Time Vermelho';
            };

            foreach (($payload['players'] ?? []) as $p) {
                $side  = is_array($p) ? ($p['side'] ?? null) : null;
                $pslug = is_array($p) ? ($p['id'] ?? null) : null;
                if (!$pslug || !in_array($side, ['blue', 'red'], true)) continue;
                if (!isset($slugToUserId[$pslug])) continue;
                $uid = $slugToUserId[$pslug];

                $win = $side === $winner;
                $evBp = $win ? $iW : $iL;
                $inhouseByUser[$uid][] = [
                    'type'      => 'inhouse',
                    'result'    => $win ? 'win' : 'loss',
                    'bp'        => $evBp,
                    'date'      => $when,
                    'shortCode' => $ih->short_code,
                    'teamName'  => $teamLabelFor($side),
                ];
                if (!isset($inhouseAgg[$uid])) $inhouseAgg[$uid] = ['wins' => 0, 'losses' => 0];
                if ($win) $inhouseAgg[$uid]['wins']++; else $inhouseAgg[$uid]['losses']++;
            }
        }

        $rows = $users->map(function (User $u) use (
            $fW, $fL, $iW, $iL, $flexByUser, $flexAgg, $inhouseByUser, $inhouseAgg
        ) {
            $uid = $u->id;
            $nick = $u->summoner_name ?: $u->name;
            $slug = $u->slug ?: $this->slugify($nick, $u->id);

            $fa = $flexAgg[$uid] ?? ['wins' => 0, 'losses' => 0];
            $ia = $inhouseAgg[$uid] ?? ['wins' => 0, 'losses' => 0];
            $flexBp = $fa['wins'] * $fW + $fa['losses'] * $fL;
            $inhouseBp = $ia['wins'] * $iW + $ia['losses'] * $iL;

            // Timeline unificada, mais recente -> antigo.
            $events = array_merge($flexByUser[$uid] ?? [], $inhouseByUser[$uid] ?? []);
            usort($events, fn ($a, $b) => strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? '')));

            return [
                'userId'        => $uid,
                'nickname'      => $nick,
                'name'          => $u->display_name ?: $u->name,
                'avatarSrc'     => $u->avatar_src,
                'activeNameId'  => $u->active_name_id,
                'slug'          => $slug,
                'flexWins'      => $fa['wins'],
                'flexLosses'    => $fa['losses'],
                'flexBp'        => $flexBp,
                'inhouseWins'   => $ia['wins'],
                'inhouseLosses' => $ia['losses'],
                'inhouseBp'     => $inhouseBp,
                'totalBp'       => $flexBp + $inhouseBp,
                'events'        => $events,
            ];
        })->sort(function ($a, $b) {
            return ($b['totalBp'] <=> $a['totalBp'])
                ?: ($a['userId'] <=> $b['userId']);
        })->values();

        return [
            'config' => [
                'flexWin'     => $fW,
                'flexLoss'    => $fL,
                'inhouseWin'  => $iW,
                'inhouseLoss' => $iL,
            ],
            'rows' => $rows,
        ];
    }

    /** Admin: log de todos os membros (ordenado por BP). */
    public function index(Request $request)
    {
        return response()->json($this->computeRows());
    }

    /** Qualquer logado: log de UM membro (modal do perfil). */
    public function forUser(Request $request, int $user)
    {
        $computed = $this->computeRows();
        $row = $computed['rows']->firstWhere('userId', $user);
        if (!$row) {
            return response()->json(['error' => 'Membro não encontrado.'], 404);
        }
        return response()->json([
            'config' => $computed['config'],
            'row'    => $row,
        ]);
    }
}

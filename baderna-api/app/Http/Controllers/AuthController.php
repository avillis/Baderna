<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\RiotAPIServices;
use Illuminate\Validation\ValidationException;
use App\Models\MemberCoin;
use App\Models\MemberUnlock;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login com email + senha. Devolve token Sanctum + user.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        // Gate de aprovação: só contas aprovadas conseguem logar.
        $status = $user->approval_status ?? 'approved';
        if ($status !== 'approved') {
            throw ValidationException::withMessages([
                'email' => [
                    $status === 'rejected'
                        ? 'Seu cadastro não foi aprovado.'
                        : 'Sua conta está aguardando aprovação de um admin.',
                ],
            ]);
        }

        // Invalida tokens antigos pra evitar acúmulo no dev.
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            // Pro próprio user, expõe email/is_admin que o User::$hidden esconde.
            'user' => $user->makeVisible(['email', 'is_admin']),
        ]);
    }

    /**
     * Apaga o token atual (o que veio no Authorization header).
     */
    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) $token->delete();

        return response()->json([
            'message' => 'Logout realizado.',
        ]);
    }

    /**
     * Cadastro: valida Riot ID via Riot API, persiste usuário e devolve token.
     */
    public function register(Request $request, RiotAPIServices $riotService)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            // Riot ID é OPCIONAL — tem gente na comunidade que não joga LoL.
            'summoner_name' => ['nullable', 'string'],
            'tag_line' => ['nullable', 'string'],
        ]);

        $hasRiot =
            !empty($validated['summoner_name']) && !empty($validated['tag_line']);

        $riotAccount = null;
        $finalSummoner = null;
        $finalTag = null;
        $avatarUrl = null;
        $iconId = null;

        if ($hasRiot) {
            try {
                $riotAccount = $riotService->getPlayerPUUIDByRiotId(
                    $validated['summoner_name'],
                    $validated['tag_line'],
                );
            } catch (\Throwable $e) {
                throw ValidationException::withMessages([
                    'summoner_name' => ['Não foi possível encontrar essa Riot ID. Confere o nome e a tag.'],
                ]);
            }

            if (empty($riotAccount['puuid'])) {
                throw ValidationException::withMessages([
                    'summoner_name' => ['Não foi possível encontrar essa Riot ID. Confere o nome e a tag.'],
                ]);
            }

            // PUUID já cadastrado em uma conta NÃO-pendente? Bloqueia.
            $puuidOwner = User::where('riot_puuid', $riotAccount['puuid'])->first();
            if ($puuidOwner && !$puuidOwner->pending_registration) {
                throw ValidationException::withMessages([
                    'summoner_name' => ['Essa Riot ID já está vinculada a outra conta.'],
                ]);
            }

            $finalSummoner = $riotAccount['gameName'] ?? $validated['summoner_name'];
            $finalTag      = $riotAccount['tagLine']  ?? $validated['tag_line'];

            // Tenta puxar o ícone de perfil pra preencher avatar_src.
            try {
                $summoner = $riotService->getSummonerByPUUID($riotAccount['puuid']);
                $iconId   = $summoner['profileIconId'] ?? null;
                $avatarUrl = $riotService->profileIconUrl($iconId);
            } catch (\Throwable $e) {
                /* segue sem avatar */
            }
        }

        // Fallback: sem Riot (ou Riot não retornou ícone) → campeão aleatório
        // do Data Dragon como avatar padrão (tile).
        if (!$avatarUrl) {
            $defaultAvatars = [
                'Aatrox', 'Ahri', 'Akali', 'Alistar', 'Ashe', 'Azir',
                'Caitlyn', 'Darius', 'Diana', 'Ekko', 'Ezreal', 'Fiora',
                'Garen', 'Jhin', 'Jinx', 'Kaisa', 'Katarina', 'Leblanc',
                'LeeSin', 'Lux', 'Malphite', 'MissFortune', 'Nasus', 'Pyke',
                'Riven', 'Senna', 'Sett', 'Sona', 'Soraka', 'Sylas', 'Syndra',
                'Thresh', 'Tristana', 'Vayne', 'Vi', 'Viego', 'Yasuo',
                'Yone', 'Zed', 'Zoe',
            ];
            $champion = $defaultAvatars[array_rand($defaultAvatars)];
            $avatarUrl = "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/{$champion}_0.jpg";
        }

        // Stub pendente com mesmo summoner+tag (só faz sentido se tem Riot)?
        // Reivindica em vez de criar — e como foi o admin que criou o stub,
        // a conta já entra APROVADA.
        $pending = null;
        if ($hasRiot) {
            $pending = User::where('pending_registration', true)
                ->whereRaw('LOWER(summoner_name) = ?', [strtolower($finalSummoner)])
                ->whereRaw('UPPER(tagLine) = ?', [strtoupper($finalTag)])
                ->first();
        }

        if ($pending) {
            $pending->update(array_filter([
                'name'                 => $validated['name'],
                'email'                => $validated['email'],
                'password'             => Hash::make($validated['password']),
                'summoner_name'        => $finalSummoner,
                'tagLine'              => $finalTag,
                'riot_puuid'           => $riotAccount['puuid'] ?? null,
                'pending_registration' => false,
                'approval_status'      => 'approved',
                'profile_icon_id'      => $iconId,
                'avatar_src'           => $avatarUrl,
            ], fn ($v) => $v !== null));
            $user = $pending->fresh();
            $needsApproval = false;
        } else {
            // Cadastro novo entra como PENDENTE — admin precisa aprovar.
            $user = User::create(array_filter([
                'name'            => $validated['name'],
                'email'           => $validated['email'],
                'password'        => Hash::make($validated['password']),
                'summoner_name'   => $finalSummoner,
                'tagLine'         => $finalTag,
                'riot_puuid'      => $hasRiot ? ($riotAccount['puuid'] ?? null) : null,
                'profile_icon_id' => $iconId,
                'avatar_src'      => $avatarUrl,
                'approval_status' => 'pending',
            ], fn ($v) => $v !== null));
            $needsApproval = true;
        }

        // Libera 5 capas aleatórias pro user (se não tiver nenhuma ainda).
        $this->grantStarterCapas($user);

        // Bônus de boas-vindas: 250 moedas pra começar.
        MemberCoin::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 250],
        );

        // Pendente: não loga (sem token). A UI mostra "aguarde aprovação".
        if ($needsApproval) {
            return response()->json([
                'message' => 'Cadastro recebido! Sua conta está aguardando aprovação de um admin.',
                'pending' => true,
            ], 201);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso!',
            'token' => $token,
            'user' => $user->makeVisible(['email', 'is_admin']),
        ], 201);
    }

    /**
     * Retorna o user atualmente autenticado (via token).
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->makeVisible(['email', 'is_admin']),
        ]);
    }

    /**
     * Concede 5 capas aleatórias pro user (idempotente — se já tem unlocks
     * de capa, não faz nada). A primeira é também definida como banner padrão.
     */
    private function grantStarterCapas(User $user): void
    {
        $hasAny = MemberUnlock::where('user_id', $user->id)
            ->where('kind', 'capa')
            ->exists();
        if ($hasAny) return;

        $dir = base_path('../campeões/splash_processed/full');
        if (!is_dir($dir)) return;

        $files = @scandir($dir) ?: [];
        $files = array_values(array_filter(
            $files,
            fn ($f) => preg_match('/\.(webp|jpg|jpeg|png)$/i', $f),
        ));
        if (count($files) === 0) return;

        shuffle($files);
        $picked = array_slice($files, 0, 5);

        foreach ($picked as $fileName) {
            MemberUnlock::firstOrCreate([
                'user_id' => $user->id,
                'kind'    => 'capa',
                'slug'    => $fileName,
            ]);
        }

        // Define o banner padrão como uma das capas desbloqueadas.
        if (!$user->banner_filename && count($picked) > 0) {
            $user->update(['banner_filename' => $picked[0]]);
        }
    }
}

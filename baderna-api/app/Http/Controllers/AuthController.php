<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\RiotAPIServices;
use Illuminate\Validation\ValidationException;
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

        // Invalida tokens antigos pra evitar acúmulo no dev.
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            'user' => $user,
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
            'summoner_name' => ['required', 'string'],
            'tag_line' => ['required', 'string'],
        ]);

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

        // Tenta puxar o ícone de perfil pra preencher avatar_src automaticamente.
        // Falha silenciosa: se a Riot recusar, segue sem avatar.
        $avatarUrl = null;
        $iconId    = null;
        try {
            $summoner = $riotService->getSummonerByPUUID($riotAccount['puuid']);
            $iconId   = $summoner['profileIconId'] ?? null;
            $avatarUrl = $riotService->profileIconUrl($iconId);
        } catch (\Throwable $e) {
            /* segue sem avatar */
        }

        // Fallback: se a Riot não retornou nada, escolhe um campeão aleatório
        // do Data Dragon pra servir como avatar padrão (tile).
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

        // Existe stub pendente com mesmo summoner+tag? Reivindica em vez de criar.
        $pending = User::where('pending_registration', true)
            ->whereRaw('LOWER(summoner_name) = ?', [strtolower($finalSummoner)])
            ->whereRaw('UPPER(tagLine) = ?', [strtoupper($finalTag)])
            ->first();

        if ($pending) {
            $pending->update(array_filter([
                'name'                 => $validated['name'],
                'email'                => $validated['email'],
                'password'             => Hash::make($validated['password']),
                'summoner_name'        => $finalSummoner,
                'tagLine'              => $finalTag,
                'riot_puuid'           => $riotAccount['puuid'],
                'pending_registration' => false,
                'profile_icon_id'      => $iconId,
                'avatar_src'           => $avatarUrl,
            ], fn ($v) => $v !== null));
            $user = $pending->fresh();
        } else {
            $user = User::create(array_filter([
                'name'            => $validated['name'],
                'email'           => $validated['email'],
                'password'        => Hash::make($validated['password']),
                'summoner_name'   => $finalSummoner,
                'tagLine'         => $finalTag,
                'riot_puuid'      => $riotAccount['puuid'],
                'profile_icon_id' => $iconId,
                'avatar_src'      => $avatarUrl,
            ], fn ($v) => $v !== null));
        }

        // Libera 5 capas aleatórias pro user (se não tiver nenhuma ainda).
        $this->grantStarterCapas($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso!',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * Retorna o user atualmente autenticado (via token).
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
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

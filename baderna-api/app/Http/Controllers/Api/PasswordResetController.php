<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Envia email com link de redefinição de senha. Resposta neutra mesmo
     * quando o email não existe (anti enumeration).
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        // Password::sendResetLink usa o broker default + a notificação
        // ResetPassword (URL customizada via AppServiceProvider pra apontar
        // pro front em vez do backend).
        Password::sendResetLink(['email' => $data['email']]);

        return response()->json([
            'message' => 'Se esse email existir, um link de redefinição foi enviado.',
        ]);
    }

    /**
     * Confirma a redefinição: recebe email + token (do link) + nova senha.
     */
    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6|max:200',
        ]);

        $status = Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Senha redefinida com sucesso. Pode entrar com a nova.',
            ]);
        }

        // Mapeia erros conhecidos pra mensagens em pt-BR.
        $msg = match ($status) {
            Password::INVALID_TOKEN => 'Link expirado ou inválido. Pede um novo.',
            Password::INVALID_USER => 'Email não encontrado.',
            default => 'Não foi possível redefinir a senha.',
        };
        return response()->json(['error' => $msg], 422);
    }
}

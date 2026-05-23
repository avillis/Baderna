<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Notifications\ResetPasswordNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\View;

/**
 * Endpoints admin pra listar/preview/testar templates de email.
 * Centraliza o catálogo num só lugar — basta adicionar no $templates
 * conforme novos emails forem criados.
 */
class EmailTemplatesController extends Controller
{
    /**
     * Catálogo de templates disponíveis. Cada entry tem:
     *  - id: slug usado nas rotas
     *  - label: nome humano
     *  - subject: assunto enviado
     *  - preview: descrição curta pro card
     *  - view: caminho do .blade.php
     *  - sampleData: dados de exemplo pro preview
     */
    private function templates(): array
    {
        return [
            'reset-password' => [
                'id' => 'reset-password',
                'label' => 'Redefinir senha',
                'subject' => 'Redefinir senha · Baderna',
                'preview' => 'Email enviado quando o usuário pede recuperação de senha.',
                'view' => 'emails.reset-password',
                'sampleData' => [
                    'name' => 'Caio Avillis',
                    'url' => 'https://bdrn.com.br/redefinir-senha?token=PREVIEW_TOKEN&email=exemplo%40bdrn.com.br',
                    'minutes' => 60,
                ],
            ],
        ];
    }

    public function index()
    {
        $list = array_values(array_map(function ($t) {
            return [
                'id' => $t['id'],
                'label' => $t['label'],
                'subject' => $t['subject'],
                'preview' => $t['preview'],
            ];
        }, $this->templates()));

        return response()->json(['templates' => $list]);
    }

    /**
     * Renderiza o template com dados de exemplo e devolve HTML.
     * Usado no <iframe> de preview no admin.
     */
    public function preview(string $id)
    {
        $tpl = $this->templates()[$id] ?? null;
        if (!$tpl) {
            return response()->json(['error' => 'Template não encontrado.'], 404);
        }

        $html = View::make($tpl['view'], $tpl['sampleData'])->render();
        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * Manda um email de teste pra o admin (ou pro endereço passado).
     */
    public function sendTest(Request $request, string $id)
    {
        $tpl = $this->templates()[$id] ?? null;
        if (!$tpl) {
            return response()->json(['error' => 'Template não encontrado.'], 404);
        }
        $data = $request->validate([
            'to' => 'nullable|email',
        ]);
        $to = $data['to'] ?? $request->user()->email;

        // Pra reset-password: dispara a notification real contra o user logado
        // (link funcional). Pros outros templates, manda HTML cru.
        if ($id === 'reset-password') {
            $request->user()->sendPasswordResetNotification('TEST_TOKEN_PREVIEW');
            return response()->json([
                'message' => "Teste enviado pra {$request->user()->email} (sempre vai pro admin logado nesse caso).",
            ]);
        }

        $html = View::make($tpl['view'], $tpl['sampleData'])->render();
        Notification::route('mail', $to)->notify(
            new \App\Notifications\GenericHtmlMail($tpl['subject'], $html)
        );

        return response()->json(['message' => "Teste enviado pra {$to}."]);
    }
}

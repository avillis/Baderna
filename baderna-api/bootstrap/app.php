<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
        ]);

        // Confia em qualquer proxy (Hostinger entrega via SSL terminator).
        // Sem isso, Laravel acha que é HTTP e gera URLs erradas.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Captura QUALQUER exception não tratada e grava em error_logs.
        // ValidationException é só "input ruim do user" — ignora.
        $exceptions->report(function (\Throwable $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) return;
            if ($e instanceof \Illuminate\Auth\AuthenticationException) return;
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException
                && $e->getStatusCode() === 404) {
                return;
            }

            try {
                $request = request();
                \App\Models\ErrorLog::create([
                    'source'       => 'error',
                    'level'        => 'error',
                    'message'      => substr($e->getMessage() ?: get_class($e), 0, 1000),
                    'url'          => $request ? $request->fullUrl() : null,
                    'method'       => $request?->method(),
                    'status_code'  => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500,
                    'user_id'      => $request?->user()?->id,
                    'ip'           => $request?->ip(),
                    'user_agent'   => $request ? substr((string)$request->userAgent(), 0, 500) : null,
                    'file'         => $e->getFile(),
                    'line'         => $e->getLine(),
                    'stack_trace'  => substr($e->getTraceAsString(), 0, 20000),
                    'context'      => null,
                    'occurred_at'  => now(),
                ]);
            } catch (\Throwable $ignored) {
                // Loop infinito é a única coisa que pode foder aqui.
            }
        });
    })->create();

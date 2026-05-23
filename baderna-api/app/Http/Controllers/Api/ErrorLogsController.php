<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ErrorLog;
use Illuminate\Http\Request;

class ErrorLogsController extends Controller
{
    /**
     * Lista paginada de logs (admin-only).
     * Query params: level, source, before (cursor).
     */
    public function index(Request $request)
    {
        $q = ErrorLog::with('user:id,name,display_name,summoner_name')
            ->orderByDesc('id')
            ->limit(30);

        if ($level = $request->query('level')) {
            $q->where('level', $level);
        }
        if ($source = $request->query('source')) {
            $q->where('source', $source);
        }
        if ($before = $request->query('before')) {
            $q->where('id', '<', (int) $before);
        }

        $rows = $q->get();
        return response()->json([
            'logs' => $rows->map(fn ($r) => $this->serialize($r)),
        ]);
    }

    /**
     * Recebe um erro do front-end (window.onerror, unhandled promise, etc.)
     * Endpoint autenticado pra não virar bucket público de spam.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'message' => 'required|string|max:1000',
            'url' => 'nullable|string|max:500',
            'stack_trace' => 'nullable|string|max:20000',
            'context' => 'nullable|array',
        ]);

        ErrorLog::create([
            'source' => 'frontend',
            'level' => 'error',
            'message' => $data['message'],
            'url' => $data['url'] ?? null,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => substr((string)$request->userAgent(), 0, 500),
            'stack_trace' => $data['stack_trace'] ?? null,
            'context' => $data['context'] ?? null,
            'occurred_at' => now(),
        ]);

        return response()->json(null, 204);
    }

    public function destroy(Request $request, int $id)
    {
        ErrorLog::where('id', $id)->delete();
        return response()->json(null, 204);
    }

    public function destroyAll(Request $request)
    {
        ErrorLog::truncate();
        return response()->json(null, 204);
    }

    private function serialize(ErrorLog $log): array
    {
        $u = $log->user;
        return [
            'id' => $log->id,
            'source' => $log->source,
            'level' => $log->level,
            'message' => $log->message,
            'url' => $log->url,
            'method' => $log->method,
            'statusCode' => $log->status_code,
            'ip' => $log->ip,
            'userAgent' => $log->user_agent,
            'file' => $log->file,
            'line' => $log->line,
            'stackTrace' => $log->stack_trace,
            'context' => $log->context,
            'occurredAt' => $log->occurred_at?->toIso8601String(),
            'user' => $u ? [
                'id' => $u->id,
                'name' => $u->display_name ?: $u->name,
                'summonerName' => $u->summoner_name,
            ] : null,
        ];
    }
}

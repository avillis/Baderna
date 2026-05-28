<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * Lista as notificações do usuário logado (mais recentes primeiro).
     * Inclui contagem de não-lidas pra alimentar o badge da campainha.
     */
    public function index(Request $request)
    {
        $user          = $request->user();
        $notifications = $user->notifications()->latest()->limit(40)->get();

        return response()->json([
            'unread_count'  => $user->unreadNotifications()->count(),
            'notifications' => $notifications->map(fn ($n) => [
                'id'      => $n->id,
                'read_at' => $n->read_at?->toIso8601String(),
                'data'    => $n->data,
            ]),
        ]);
    }

    /** Marca uma notificação como lida. Idempotente. */
    public function markAsRead(Request $request, string $id)
    {
        $notif = $request->user()->notifications()->find($id);
        if ($notif && ! $notif->read_at) {
            $notif->markAsRead();
        }
        return response()->json(null, 204);
    }

    /** Deleta uma notificação. */
    public function destroy(Request $request, string $id)
    {
        $request->user()->notifications()->find($id)?->delete();
        return response()->json(null, 204);
    }
}

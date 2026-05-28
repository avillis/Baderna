<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posta (e atualiza) a lista de aniversários da Baderna no Discord via webhook.
 *
 * Strategy: na primeira chamada, faz POST com ?wait=true pra receber o
 * message_id de volta. Guarda em app_settings. Nas próximas chamadas, faz
 * PATCH no mesmo message_id — mensagem se atualiza no lugar, sem encher
 * o canal de spam.
 *
 * Se o message_id ficar inválido (canal limpo, msg apagada manualmente),
 * a próxima chamada cai pra POST novo automaticamente.
 */
class BirthdayWebhook
{
    private const BRAND_COLOR     = 0xFF4100;
    private const TIMEOUT_SECONDS = 5;
    private const SETTING_KEY     = 'discord_birthdays_message_id';

    private const MONTH_PT = [
        1  => 'Janeiro',
        2  => 'Fevereiro',
        3  => 'Março',
        4  => 'Abril',
        5  => 'Maio',
        6  => 'Junho',
        7  => 'Julho',
        8  => 'Agosto',
        9  => 'Setembro',
        10 => 'Outubro',
        11 => 'Novembro',
        12 => 'Dezembro',
    ];

    public static function postOrUpdate(): bool
    {
        $webhookUrl = config('services.discord.birthdays_webhook');
        if (! $webhookUrl) {
            return false;
        }

        $members = User::whereNotNull('birthday')
            ->where(function ($q) {
                $q->whereNull('birthday_hidden')->orWhere('birthday_hidden', false);
            })
            ->where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->get(['display_name', 'summoner_name', 'birthday']);

        $body = self::buildBody($members);

        $existingId = AppSetting::get(self::SETTING_KEY);

        if ($existingId) {
            try {
                $res = Http::timeout(self::TIMEOUT_SECONDS)
                    ->patch("{$webhookUrl}/messages/{$existingId}", $body);

                if ($res->successful()) {
                    return true;
                }

                if ($res->status() === 404) {
                    // Mensagem foi deletada — vai criar uma nova abaixo
                    AppSetting::where('key', self::SETTING_KEY)->delete();
                } else {
                    Log::warning('BirthdayWebhook PATCH failed', [
                        'status' => $res->status(),
                        'body'   => $res->body(),
                    ]);
                    return false;
                }
            } catch (Throwable $e) {
                Log::warning('BirthdayWebhook PATCH exception', ['err' => $e->getMessage()]);
                return false;
            }
        }

        // POST novo
        try {
            $res = Http::timeout(self::TIMEOUT_SECONDS)
                ->post("{$webhookUrl}?wait=true", $body);

            if (! $res->successful()) {
                Log::warning('BirthdayWebhook POST failed', [
                    'status' => $res->status(),
                    'body'   => $res->body(),
                ]);
                return false;
            }

            $data = $res->json();
            if (! empty($data['id'])) {
                AppSetting::put(self::SETTING_KEY, $data['id']);
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('BirthdayWebhook POST exception', ['err' => $e->getMessage()]);
            return false;
        }
    }

    private static function buildBody($members): array
    {
        $siteBase = rtrim((string) config('app.frontend_url', 'https://bdrn.com.br'), '/');

        return [
            'embeds' => [[
                'title'       => '🎂 Aniversários da Baderna',
                'description' => self::formatList($members),
                'color'       => self::BRAND_COLOR,
                'url'         => "{$siteBase}/members",
                'footer'      => ['text' => 'Atualizado via bdrn.com.br'],
                'timestamp'   => now()->toIso8601String(),
            ]],
        ];
    }

    private static function formatList($members): string
    {
        if ($members->isEmpty()) {
            return '*Nenhum aniversário cadastrado ainda.*';
        }

        $today   = now()->startOfDay();
        $entries = [];

        foreach ($members as $m) {
            // Próxima ocorrência do aniversário a partir de hoje
            $bd = $m->birthday->copy()->setYear($today->year);
            if ($bd->lt($today)) $bd->addYear();

            $daysUntil = (int) $today->diffInDays($bd);
            $day   = $m->birthday->format('d');
            $month = $m->birthday->format('m');
            $nick  = $m->summoner_name ?: $m->display_name;

            if ($daysUntil === 0)     $when = '🎉 **HOJE!**';
            elseif ($daysUntil === 1) $when = 'amanhã';
            else                      $when = "em {$daysUntil} dias";

            $entries[] = [
                'days' => $daysUntil,
                'line' => "🎂 **{$day}/{$month}** — {$nick} · {$when}",
            ];
        }

        usort($entries, fn ($a, $b) => $a['days'] - $b['days']);

        return implode("\n", array_column($entries, 'line'));
    }
}

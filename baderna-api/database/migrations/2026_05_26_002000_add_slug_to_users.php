<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('slug', 30)->nullable()->after('name');
        });

        // Backfill: cada user ganha um slug derivado do summoner_name (ou name,
        // ou id). Colisão entre users diferentes resolve anexando -{id}.
        $taken = [];
        $users = DB::table('users')->orderBy('id')->get(['id', 'name', 'summoner_name']);
        foreach ($users as $u) {
            $nick = $u->summoner_name ?: $u->name;
            $base = self::slugify($nick, $u->id);
            $slug = $base;
            if (in_array($slug, $taken, true)) {
                $slug = $base . '-' . $u->id;
            }
            $taken[] = $slug;
            DB::table('users')->where('id', $u->id)->update(['slug' => $slug]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }

    private static function slugify(?string $nick, int $userId): string
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
        if ($slug === '') return (string)$userId;
        return mb_substr($slug, 0, 30);
    }
};

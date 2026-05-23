<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Cria a coluna nullable primeiro (backfill em seguida exige isso).
        Schema::table('posts', function (Blueprint $table) {
            $table->string('short_code', 12)->nullable()->after('id');
        });

        // 2) Backfill — gera código único pra cada post existente.
        $existing = DB::table('posts')->select('id')->get();
        $used = [];
        foreach ($existing as $row) {
            do {
                $code = Str::random(8);
            } while (
                isset($used[$code]) ||
                DB::table('posts')->where('short_code', $code)->exists()
            );
            $used[$code] = true;
            DB::table('posts')->where('id', $row->id)->update(['short_code' => $code]);
        }

        // 3) Agora pode tornar NOT NULL + unique.
        Schema::table('posts', function (Blueprint $table) {
            $table->string('short_code', 12)->nullable(false)->change();
            $table->unique('short_code');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropUnique(['short_code']);
            $table->dropColumn('short_code');
        });
    }
};

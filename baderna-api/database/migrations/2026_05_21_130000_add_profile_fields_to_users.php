<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->text('bio')->nullable()->after('display_name');
            $table->string('team_name')->nullable()->after('bio');
            $table->string('avatar_src')->nullable()->after('team_name');
            $table->string('active_name_id')->nullable()->after('avatar_src');
            $table->json('active_title_slugs')->nullable()->after('active_name_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'bio',
                'team_name',
                'avatar_src',
                'active_name_id',
                'active_title_slugs',
            ]);
        });
    }
};

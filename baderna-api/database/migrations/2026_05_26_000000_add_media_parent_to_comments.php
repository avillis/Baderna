<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (!Schema::hasColumn('comments', 'image_url')) {
                $table->string('image_url')->nullable()->after('body');
            }
            if (!Schema::hasColumn('comments', 'gif_url')) {
                $table->string('gif_url')->nullable()->after('image_url');
            }
            if (!Schema::hasColumn('comments', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('user_id');
                $table->foreign('parent_id')->references('id')->on('comments')->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            if (Schema::hasColumn('comments', 'parent_id')) {
                $table->dropForeign(['parent_id']);
                $table->dropColumn('parent_id');
            }
            if (Schema::hasColumn('comments', 'gif_url')) {
                $table->dropColumn('gif_url');
            }
            if (Schema::hasColumn('comments', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('body');
            $table->string('gif_url')->nullable()->after('image_url');
            $table->unsignedBigInteger('parent_id')->nullable()->after('user_id');
            $table->foreign('parent_id')->references('id')->on('comments')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['image_url', 'gif_url', 'parent_id']);
        });
    }
};

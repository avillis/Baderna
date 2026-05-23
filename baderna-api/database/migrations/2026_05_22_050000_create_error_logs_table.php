<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();
            // 'error' = exception backend, 'frontend' = JS runtime, 'http' = 4xx/5xx
            $table->string('source', 20)->default('error')->index();
            // 'error' / 'warning' / 'info'
            $table->string('level', 20)->default('error')->index();
            $table->string('message', 1000);
            $table->string('url', 500)->nullable();
            $table->string('method', 10)->nullable();
            $table->integer('status_code')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip', 64)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('file', 500)->nullable();
            $table->integer('line')->nullable();
            $table->longText('stack_trace')->nullable();
            $table->json('context')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_logs');
    }
};

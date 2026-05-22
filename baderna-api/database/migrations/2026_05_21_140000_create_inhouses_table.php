<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inhouses', function (Blueprint $table) {
            $table->id();
            $table->string('short_code', 16)->unique();
            // Payload do InhouseMatchResult inteiro — players, leaders, mode, etc.
            $table->json('payload');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inhouses');
    }
};

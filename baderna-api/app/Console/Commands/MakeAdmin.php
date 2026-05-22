<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    protected $signature = 'baderna:make-admin {email}';
    protected $description = 'Marca um usuário como admin pelo email.';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("Usuário não encontrado: {$email}");
            return self::FAILURE;
        }
        $user->update(['is_admin' => true]);
        $this->info("✓ {$user->name} ({$email}) agora é admin.");
        return self::SUCCESS;
    }
}

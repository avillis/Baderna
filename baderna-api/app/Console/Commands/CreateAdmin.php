<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    protected $signature = 'baderna:create-admin
        {email : Email do admin}
        {--name= : Nome (padrão: derivado do email)}
        {--password= : Senha (padrão: baderna)}
        {--summoner= : Summoner name}
        {--tag= : Tag line}';

    protected $description = 'Cria ou atualiza um usuário com is_admin=true.';

    public function handle(): int
    {
        $email = $this->argument('email');
        $name = $this->option('name') ?: ucfirst(strstr($email, '@', true) ?: 'Admin');
        $password = $this->option('password') ?: 'baderna';
        $summoner = $this->option('summoner');
        $tag = $this->option('tag');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'is_admin' => true,
                'summoner_name' => $summoner,
                'tagLine' => $tag,
            ],
        );

        $this->info("✓ Admin criado/atualizado:");
        $this->line("  id:        {$user->id}");
        $this->line("  name:      {$user->name}");
        $this->line("  email:     {$user->email}");
        $this->line("  senha:     {$password}");
        $this->line("  summoner:  {$user->summoner_name}#{$user->tagLine}");
        $this->line("  is_admin:  true");
        return self::SUCCESS;
    }
}

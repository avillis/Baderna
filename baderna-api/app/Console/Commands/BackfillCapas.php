<?php

namespace App\Console\Commands;

use App\Models\MemberUnlock;
use App\Models\User;
use Illuminate\Console\Command;

class BackfillCapas extends Command
{
    protected $signature = 'baderna:backfill-capas';
    protected $description = 'Concede 5 capas aleatórias + banner default pra usuários que ainda não têm.';

    public function handle(): int
    {
        $dir = base_path('../campeões/splash_processed/full');
        if (!is_dir($dir)) {
            $this->error("Pasta de capas não encontrada: {$dir}");
            return self::FAILURE;
        }

        $files = @scandir($dir) ?: [];
        $files = array_values(array_filter(
            $files,
            fn ($f) => preg_match('/\.(webp|jpg|jpeg|png)$/i', $f),
        ));
        if (count($files) === 0) {
            $this->error("Nenhuma capa encontrada em {$dir}");
            return self::FAILURE;
        }

        $touched = 0;
        $users = User::all();
        foreach ($users as $user) {
            $hasAny = MemberUnlock::where('user_id', $user->id)
                ->where('kind', 'capa')
                ->exists();
            if ($hasAny) continue;

            $local = $files;
            shuffle($local);
            $picked = array_slice($local, 0, 5);

            foreach ($picked as $fileName) {
                MemberUnlock::firstOrCreate([
                    'user_id' => $user->id,
                    'kind'    => 'capa',
                    'slug'    => $fileName,
                ]);
            }

            if (!$user->banner_filename && count($picked) > 0) {
                $user->update(['banner_filename' => $picked[0]]);
            }

            $touched++;
            $this->line("  ✓ {$user->name} ({$user->email}): " . count($picked) . " capas");
        }

        $this->info("Concluído. {$touched} usuário(s) atualizado(s).");
        return self::SUCCESS;
    }
}

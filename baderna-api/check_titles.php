<?php
chdir('/home/u955637513/domains/bdrn.com.br/public_html/api');
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::whereNotNull('name')
    ->where('pending_registration', false)
    ->get(['id', 'summoner_name', 'display_name', 'active_title_slugs']);

echo "=== active_title_slugs no banco ===\n";
foreach ($users as $u) {
    $nick = $u->summoner_name ?: $u->display_name;
    $val = json_encode($u->active_title_slugs);
    echo "{$u->id}: {$nick} => {$val}\n";
}

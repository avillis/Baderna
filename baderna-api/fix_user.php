$u = App\Models\User::find(1);
$u->approval_status = 'approved';
$u->is_deleted = false;
$u->save();
echo 'approval: ' . $u->approval_status . ', deleted: ' . ($u->is_deleted ? 'true' : 'false');

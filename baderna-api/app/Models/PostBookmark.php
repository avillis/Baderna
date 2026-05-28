<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PostBookmark extends Model {
    public $timestamps = false;
    const CREATED_AT = 'created_at';
    protected $fillable = ['user_id', 'post_id'];
}

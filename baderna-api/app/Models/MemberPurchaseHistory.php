<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberPurchaseHistory extends Model
{
    protected $table = 'member_purchase_history';

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'user_id',
        'kind',
        'item_id',
        'item_label',
        'rarity',
        'cost',
        'refunded',
        'free',
        'balance_after',
    ];

    protected $casts = [
        'refunded'   => 'boolean',
        'free'       => 'boolean',
        'created_at' => 'datetime',
    ];
}

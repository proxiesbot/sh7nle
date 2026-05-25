<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GiftCard extends Model
{
    use HasFactory;

    protected $fillable = ['code','amount','status','buyer_id','redeemed_by','redeemed_at','source','meta'];

    protected $casts = [
        'amount' => 'decimal:8',
        'redeemed_at' => 'datetime',
        'meta' => 'array',
    ];

    public function buyer() { return $this->belongsTo(User::class, 'buyer_id'); }
    public function redeemedBy() { return $this->belongsTo(User::class, 'redeemed_by'); }
}

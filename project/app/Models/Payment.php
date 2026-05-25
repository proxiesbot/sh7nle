<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_id',
        'user_id',
        'card_id',
        'destinationProfileId',
        'orderId',
        'orderUuid',
        'amount',
        'price',
        'cost_price',
        'profit_amount',
        'referral_commission_amount',
        'status',
        'provider_status',
        'delivered_codes',
        'delivery_details',
        'provider_payload',
        'refunded_at',
        'referral_commission_paid_at',
    ];

    protected $casts = [
        'price' => 'decimal:8',
        'cost_price' => 'decimal:8',
        'profit_amount' => 'decimal:8',
        'referral_commission_amount' => 'decimal:8',
        'delivery_details' => 'array',
        'provider_payload' => 'array',
        'refunded_at' => 'datetime',
        'referral_commission_paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}

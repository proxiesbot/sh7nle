<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image',
        'icon',
        'account',
        'notes',
        'status',
        'provider',
        'is_automatic',
        'allow_manual_fallback',
        'requires_payment_id',
        'requires_image',
        'config',
        'available_for_referral_withdrawal',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_automatic' => 'boolean',
        'allow_manual_fallback' => 'boolean',
        'requires_payment_id' => 'boolean',
        'requires_image' => 'boolean',
        'config' => 'array',
        'available_for_referral_withdrawal' => 'boolean',
    ];

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function referralWithdrawals()
    {
        return $this->hasMany(ReferralWithdrawal::class);
    }
}


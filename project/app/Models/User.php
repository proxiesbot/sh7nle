<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use HasProfilePhoto;
    use Notifiable;
    use TwoFactorAuthenticatable;
    use HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'balance',
        'email_verified_at',
        'is_blocked',
        'special_price_discount_percentage',
        'reseller_markup_percentage',
        'customer_level',
        'api_enabled',
        'api_token',
        'wheel_spins',
        'referral_rate_percentage',
        'referral_code',
        'referred_by_user_id',
        'referral_balance',
        'total_referral_earnings',
        'whatsapp_number',
        'last_seen_at',
        'last_security_confirmation_sent_at',
        'account_verification_status',
        'account_verification_notes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'balance' => 'decimal:8',
        'is_blocked' => 'boolean',
        'special_price_discount_percentage' => 'decimal:2',
        'reseller_markup_percentage' => 'decimal:2',
        'customer_level' => 'integer',
        'api_enabled' => 'boolean',
        'referral_rate_percentage' => 'decimal:2',
        'referral_balance' => 'decimal:2',
        'total_referral_earnings' => 'decimal:2',
        'last_seen_at' => 'datetime',
        'last_security_confirmation_sent_at' => 'datetime',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'receiver_id');
    }

    public function unseenNotifications()
    {
        return $this->notifications()->where('seen', false);
    }

    public function sentNotifications()
    {
        return $this->hasMany(Notification::class, 'sender_id');
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }

    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by_user_id');
    }

    public function wheelSpins()
    {
        return $this->hasMany(WheelSpin::class);
    }

    public function activeWheelSpins()
    {
        return $this->wheelSpins()->active();
    }

    public function wheelSpinLogs()
    {
        return $this->hasMany(WheelSpinLog::class);
    }

    public function referralWithdrawals()
    {
        return $this->hasMany(ReferralWithdrawal::class);
    }

    public function loginActivities()
    {
        return $this->hasMany(LoginActivity::class);
    }
}


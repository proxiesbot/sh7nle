<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'direction', 'amount', 'balance_before', 'balance_after',
        'description', 'reference_type', 'reference_id', 'admin_id', 'meta',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'balance_before' => 'decimal:8',
        'balance_after' => 'decimal:8',
        'meta' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function admin() { return $this->belongsTo(User::class, 'admin_id'); }
}

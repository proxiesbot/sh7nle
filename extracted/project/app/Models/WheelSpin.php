<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WheelSpin extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'source', 'status', 'expires_at', 'consumed_at',
        'created_by_admin_id', 'meta',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function admin() { return $this->belongsTo(User::class, 'created_by_admin_id'); }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now());
    }
}

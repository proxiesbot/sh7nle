<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event',
        'ip_address',
        'user_agent',
        'browser',
        'platform',
        'device_type',
        'is_new_device',
    ];

    protected $casts = [
        'is_new_device' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

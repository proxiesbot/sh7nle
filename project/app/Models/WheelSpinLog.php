<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WheelSpinLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'wheel_spin_id', 'wheel_prize_id', 'action',
        'prize_name', 'prize_type', 'prize_value', 'message', 'meta',
    ];

    protected $casts = [
        'prize_value' => 'decimal:8',
        'meta' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function spin() { return $this->belongsTo(WheelSpin::class, 'wheel_spin_id'); }
    public function prize() { return $this->belongsTo(WheelPrize::class, 'wheel_prize_id'); }
}

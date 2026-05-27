<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WheelPrize extends Model
{
    use HasFactory;
    protected $fillable = ['name','type','value','weight','min_order_amount','is_active','meta'];
    protected $casts = ['value'=>'decimal:8','min_order_amount'=>'decimal:8','is_active'=>'boolean','meta'=>'array'];
}

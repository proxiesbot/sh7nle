<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'image',
        'link',
        'is_active',
        'sort_order',
        'autoplay_seconds',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'autoplay_seconds' => 'integer',
    ];
}

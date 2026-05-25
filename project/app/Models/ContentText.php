<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentText extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'default_text',
        'text',
        'context',
    ];
}

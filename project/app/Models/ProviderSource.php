<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProviderSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'driver',
        'base_url',
        'api_token',
        'auth_header',
        'auth_prefix',
        'catalog_endpoint',
        'product_endpoint',
        'order_endpoint',
        'check_endpoint',
        'supports_catalog',
        'is_active',
        'config',
    ];

    protected $casts = [
        'supports_catalog' => 'boolean',
        'is_active' => 'boolean',
        'config' => 'array',
    ];

    protected $hidden = ['api_token'];

    public function cards()
    {
        return $this->hasMany(Card::class);
    }
}

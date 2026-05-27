<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImportedProviderProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_source_id',
        'remote_id',
        'remote_parent_id',
        'category_path',
        'category_names',
        'name',
        'description',
        'image',
        'provider_product_type',
        'price',
        'base_price',
        'cost_price',
        'provider_cost_price',
        'available',
        'requires_player_id',
        'requires_secondary_player_id',
        'player_id_label',
        'secondary_player_id_label',
        'quantity_label',
        'amount_mode',
        'delivery_mode',
        'purchase_flow',
        'min_amount',
        'max_amount',
        'provider_qty_values',
        'provider_params',
        'raw_payload',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'provider_cost_price' => 'decimal:2',
        'available' => 'boolean',
        'requires_player_id' => 'boolean',
        'requires_secondary_player_id' => 'boolean',
        'min_amount' => 'float',
        'max_amount' => 'float',
        'category_names' => 'array',
        'provider_qty_values' => 'array',
        'provider_params' => 'array',
        'raw_payload' => 'array',
    ];

    public function providerSource()
    {
        return $this->belongsTo(ProviderSource::class);
    }
}

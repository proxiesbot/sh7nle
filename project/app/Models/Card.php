<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'section_id',
        'sort_order',
        'subcategory_id',
        'provider_source_id',
        'background',
        'icon',
        'description',
        'price',
        'minAmount',
        'maxAmount',
        'discount',
        'sawaCardId',
        'provider_product_id',
        'requires_player_id',
        'player_id_label',
        'quantity_label',
        'amount_mode',
        'delivery_mode',
        'provider_product_type',
        'provider_qty_values',
        'provider_params',
        'purchase_flow',
        'requires_secondary_player_id',
        'secondary_player_id_label',
        'option_prices',
        'option_costs',
        'provider_option_product_ids',
        'cost_price',
        'provider_cost_price',
        'price_adjustment_percentage',
        'profit_percentage',
        'is_active',
        'order_count',
        'manual_unavailable',
        'provider_unavailable_at',
        'availability_note',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'price' => 'decimal:8',
        'provider_source_id' => 'integer',
        'sort_order' => 'integer',
        'cost_price' => 'decimal:8',
        'provider_cost_price' => 'decimal:8',
        'price_adjustment_percentage' => 'decimal:2',
        'profit_percentage' => 'decimal:2',
        'requires_player_id' => 'boolean',
        'provider_qty_values' => 'array',
        'provider_params' => 'array',
        'option_prices' => 'array',
        'option_costs' => 'array',
        'provider_option_product_ids' => 'array',
        'requires_secondary_player_id' => 'boolean',
        'is_active' => 'boolean',
        'manual_unavailable' => 'boolean',
        'provider_unavailable_at' => 'datetime',
        'order_count' => 'integer',
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function providerSource()
    {
        return $this->belongsTo(ProviderSource::class);
    }
}

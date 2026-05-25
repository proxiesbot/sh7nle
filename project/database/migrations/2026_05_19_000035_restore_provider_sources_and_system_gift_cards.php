<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('provider_sources')) {
            DB::table('provider_sources')->updateOrInsert(
                ['slug' => 'shams-store'],
                [
                    'name' => 'Shams Store',
                    'driver' => 'sawa',
                    'base_url' => 'https://api.shams4store.com/client/api',
                    'api_token' => env('SHAMS_API_TOKEN') ?: env('SAWA_CARD_API_TOKEN'),
                    'auth_header' => 'api-token',
                    'auth_prefix' => null,
                    'catalog_endpoint' => '/content/{parentId}',
                    'product_endpoint' => '/products?products_id={id}',
                    'order_endpoint' => '/newOrder/{id}/params',
                    'check_endpoint' => '/check',
                    'supports_catalog' => true,
                    'is_active' => true,
                    'config' => json_encode([
                        'order_data_path' => 'data',
                        'verify_ssl' => true,
                        'field_map' => [
                            'id' => 'id',
                            'name' => 'name',
                            'price' => 'price',
                            'base_price' => 'base_price',
                            'product_type' => 'product_type',
                            'params' => 'params',
                            'qty_values' => 'qty_values',
                            'category_name' => 'category_name',
                            'parent_id' => 'parent_id',
                            'image' => 'category_img',
                            'available' => 'available',
                        ],
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            DB::table('provider_sources')->updateOrInsert(
                ['slug' => 'sw-games'],
                [
                    'name' => 'SW Games',
                    'driver' => 'swgames',
                    'base_url' => env('SW_GAMES_BASE_URL', 'https://sw-games.net/api/fastapi'),
                    'api_token' => env('SW_GAMES_API_TOKEN'),
                    'auth_header' => 'apiToken',
                    'auth_prefix' => null,
                    'catalog_endpoint' => '/products',
                    'product_endpoint' => '/products',
                    'order_endpoint' => '/requestorder/{id}/params',
                    'check_endpoint' => '/checkorders',
                    'supports_catalog' => true,
                    'is_active' => true,
                    'config' => json_encode([
                        'order_data_path' => 'data',
                        'verify_ssl' => true,
                        'field_map' => [
                            'id' => 'id',
                            'name' => 'name',
                            'price' => 'price',
                            'base_price' => 'price',
                            'image' => 'image',
                            'available' => 'isActive',
                            'game_id' => 'game_id',
                            'game_name' => 'gameName',
                            'min_count' => 'minCount',
                            'max_count' => 'maxCount',
                            'currency' => 'currency',
                            'dynamic_fields' => 'daynamicFields',
                        ],
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        if (! Schema::hasTable('sections') || ! Schema::hasTable('cards')) {
            return;
        }

        $sectionId = DB::table('sections')->where('name', 'Sh7nle Gift Cards')->value('id');
        if (! $sectionId) {
            $sectionId = DB::table('sections')->insertGetId([
                'name' => 'Sh7nle Gift Cards',
                'description' => 'بطاقات رصيد داخلية خاصة بمنصة Sh7nle.',
                'section_id' => 0,
                'icon' => '/demo/products/sh7nle-gift-card.svg',
                'background' => '/demo/products/sh7nle-gift-card.svg',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ([5, 10, 15, 20, 25, 50] as $amount) {
            DB::table('cards')->updateOrInsert(
                ['name' => "Sh7nle Gift Card {$amount}$"],
                [
                    'section_id' => $sectionId,
                    'description' => "بطاقة شحنلي بقيمة {$amount}$ تظهر ككود داخل طلباتي ويمكن استردادها من زر Gift Card.",
                    'price' => $amount,
                    'cost_price' => $amount,
                    'provider_cost_price' => $amount,
                    'price_adjustment_percentage' => 0,
                    'profit_percentage' => 0,
                    'minAmount' => 1,
                    'maxAmount' => 20,
                    'discount' => 0,
                    'sawaCardId' => '0',
                    'provider_source_id' => null,
                    'provider_product_id' => null,
                    'icon' => '/demo/products/sh7nle-gift-card.svg',
                    'background' => '/demo/products/sh7nle-gift-card.svg',
                    'requires_player_id' => false,
                    'requires_secondary_player_id' => false,
                    'quantity_label' => 'عدد البطاقات',
                    'amount_mode' => 'quantity',
                    'delivery_mode' => 'internal_gift_card',
                    'provider_product_type' => 'internal_gift_card',
                    'provider_qty_values' => json_encode([$amount], JSON_UNESCAPED_UNICODE),
                    'provider_params' => json_encode([], JSON_UNESCAPED_UNICODE),
                    'purchase_flow' => 'codes_quantity',
                    'option_prices' => json_encode([(string) $amount => $amount], JSON_UNESCAPED_UNICODE),
                    'option_costs' => json_encode([(string) $amount => $amount], JSON_UNESCAPED_UNICODE),
                    'is_active' => true,
                    'manual_unavailable' => false,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        // Safe restore migration: keep data on rollback.
    }
};

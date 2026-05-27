<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('provider_sources')
            ->where('slug', 'shams4store')
            ->update([
                'catalog_endpoint' => '/content/{parentId}',
                'product_endpoint' => '/products',
                'config' => json_encode([
                    'catalog_categories_path' => 'categories',
                    'catalog_products_path' => 'products',
                    'catalog_max_depth' => 8,
                    'catalog_fallback_endpoint' => '/products',
                    'catalog_fallback_products_path' => '__root__',
                    'product_data_path' => '__root__',
                    'product_lookup_param' => 'products_id',
                    'order_data_path' => 'data',
                    'check_data_path' => 'data',
                    'order_http_method' => 'post',
                    'field_map' => [
                        'id' => 'id',
                        'name' => 'name',
                        'price' => 'price',
                        'base_price' => 'price',
                        'product_type' => 'product_type',
                        'params' => 'params',
                        'qty_values' => 'qty_values',
                        'category_name' => 'category_name',
                        'parent_id' => 'parent_id',
                        'available' => 'available',
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('provider_sources')
            ->where('slug', 'shams4store')
            ->update([
                'catalog_endpoint' => '/products',
                'product_endpoint' => '/products?products_id={id}',
                'config' => json_encode([
                    'catalog_products_path' => '__root__',
                    'product_data_path' => '__root__',
                    'order_data_path' => 'data',
                    'check_data_path' => 'data',
                    'order_http_method' => 'post',
                    'field_map' => [
                        'id' => 'id',
                        'name' => 'name',
                        'price' => 'price',
                        'base_price' => 'price',
                        'product_type' => 'product_type',
                        'params' => 'params',
                        'qty_values' => 'qty_values',
                        'category_name' => 'category_name',
                        'parent_id' => 'parent_id',
                        'available' => 'available',
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }
};

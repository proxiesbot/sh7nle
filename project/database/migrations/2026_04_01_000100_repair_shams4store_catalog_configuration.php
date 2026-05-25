<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $provider = DB::table('provider_sources')->where('slug', 'shams4store')->first();

        $config = [];
        if ($provider?->config) {
            $decoded = json_decode($provider->config, true);
            if (is_array($decoded)) {
                $config = $decoded;
            }
        }

        $config = array_replace_recursive([
            'catalog_categories_path' => 'data.categories',
            'catalog_products_path' => 'data.products',
            'catalog_tree_endpoint' => '/content/{parentId}',
            'catalog_fallback_endpoint' => '/products',
            'catalog_fallback_products_path' => '__root__',
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
                'image' => 'image',
            ],
        ], $config);

        DB::table('provider_sources')
            ->where('slug', 'shams4store')
            ->update([
                'base_url' => 'https://api.shams4store.com/client/api',
                'catalog_endpoint' => '/content/{parentId}',
                'product_endpoint' => '/products',
                'order_endpoint' => '/newOrder/{id}/params',
                'check_endpoint' => '/check',
                'supports_catalog' => true,
                'is_active' => true,
                'config' => json_encode($config, JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // no-op
    }
};

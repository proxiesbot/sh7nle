<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_sources', function (Blueprint $table) {
            $table->string('check_endpoint')->nullable()->after('order_endpoint');
        });

        DB::table('provider_sources')->updateOrInsert(
            ['slug' => 'shams4store'],
            [
                'name' => 'Shams4Store',
                'driver' => 'generic',
                'base_url' => 'https://api.shams4store.com/client/api',
                'api_token' => env('SHAMS4STORE_API_TOKEN'),
                'auth_header' => 'api-token',
                'auth_prefix' => null,
                'catalog_endpoint' => '/products',
                'product_endpoint' => '/products?products_id={id}',
                'order_endpoint' => '/newOrder/{id}/params',
                'check_endpoint' => '/check',
                'supports_catalog' => true,
                'is_active' => true,
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
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('provider_sources')->where('slug', 'shams4store')->delete();

        Schema::table('provider_sources', function (Blueprint $table) {
            $table->dropColumn('check_endpoint');
        });
    }
};

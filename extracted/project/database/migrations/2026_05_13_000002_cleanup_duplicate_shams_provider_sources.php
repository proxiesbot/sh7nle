<?php

use App\Models\ProviderSource;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (! class_exists(ProviderSource::class)) {
            return;
        }

        ProviderSource::query()
            ->whereIn('slug', ['sawa5card', 'shams4store'])
            ->delete();

        ProviderSource::query()->updateOrCreate(
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
                'config' => [
                    'verify_ssl' => true,
                ],
            ]
        );

        ProviderSource::query()->updateOrCreate(
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
                'config' => [
                    'verify_ssl' => true,
                ],
            ]
        );
    }

    public function down(): void
    {
        // no-op
    }
};

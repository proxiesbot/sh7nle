<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('driver')->default('sawa');
            $table->string('base_url')->nullable();
            $table->text('api_token')->nullable();
            $table->string('auth_header')->default('api-token');
            $table->string('auth_prefix')->nullable();
            $table->string('catalog_endpoint')->nullable();
            $table->string('product_endpoint')->nullable();
            $table->string('order_endpoint')->nullable();
            $table->boolean('supports_catalog')->default(true);
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_sources');
    }
};

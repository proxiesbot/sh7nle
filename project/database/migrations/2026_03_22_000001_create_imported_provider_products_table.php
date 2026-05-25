<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imported_provider_products', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(\App\Models\ProviderSource::class)->constrained()->cascadeOnDelete();
            $table->string('remote_id');
            $table->string('remote_parent_id')->nullable();
            $table->string('category_path')->nullable();
            $table->json('category_names')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('image')->nullable();
            $table->string('provider_product_type')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('base_price', 12, 2)->default(0);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('provider_cost_price', 12, 2)->default(0);
            $table->boolean('available')->default(true);
            $table->boolean('requires_player_id')->default(false);
            $table->boolean('requires_secondary_player_id')->default(false);
            $table->string('player_id_label')->nullable();
            $table->string('secondary_player_id_label')->nullable();
            $table->string('quantity_label')->nullable();
            $table->string('amount_mode')->nullable();
            $table->string('delivery_mode')->nullable();
            $table->string('purchase_flow')->nullable();
            $table->unsignedInteger('min_amount')->default(1);
            $table->unsignedInteger('max_amount')->default(1);
            $table->json('provider_qty_values')->nullable();
            $table->json('provider_params')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['provider_source_id', 'remote_id']);
            $table->index(['provider_source_id', 'available']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imported_provider_products');
    }
};

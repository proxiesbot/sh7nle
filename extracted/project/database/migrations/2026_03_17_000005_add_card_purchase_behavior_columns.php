<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->boolean('requires_player_id')->default(false)->after('sawaCardId');
            $table->string('player_id_label')->nullable()->after('requires_player_id');
            $table->string('quantity_label')->nullable()->after('player_id_label');
            $table->string('amount_mode')->default('quantity')->after('quantity_label');
            $table->string('delivery_mode')->default('api_codes')->after('amount_mode');
            $table->string('provider_product_type')->nullable()->after('delivery_mode');
            $table->json('provider_qty_values')->nullable()->after('provider_product_type');
            $table->json('provider_params')->nullable()->after('provider_qty_values');
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn([
                'requires_player_id',
                'player_id_label',
                'quantity_label',
                'amount_mode',
                'delivery_mode',
                'provider_product_type',
                'provider_qty_values',
                'provider_params',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('orderUuid')->nullable()->after('orderId');
            $table->string('provider_status')->nullable()->after('status');
            $table->longText('delivered_codes')->nullable()->after('provider_status');
            $table->json('delivery_details')->nullable()->after('delivered_codes');
            $table->json('provider_payload')->nullable()->after('delivery_details');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'orderUuid',
                'provider_status',
                'delivered_codes',
                'delivery_details',
                'provider_payload',
            ]);
        });
    }
};

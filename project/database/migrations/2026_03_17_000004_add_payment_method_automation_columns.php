<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->boolean('status')->default(true)->after('notes');
            $table->string('provider')->default('manual')->after('status');
            $table->boolean('is_automatic')->default(false)->after('provider');
            $table->boolean('requires_payment_id')->default(true)->after('is_automatic');
            $table->boolean('requires_image')->default(true)->after('requires_payment_id');
            $table->json('config')->nullable()->after('requires_image');
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'provider',
                'is_automatic',
                'requires_payment_id',
                'requires_image',
                'config',
            ]);
        });
    }
};

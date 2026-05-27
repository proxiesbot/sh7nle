<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'reseller_markup_percentage')) {
                $table->decimal('reseller_markup_percentage', 5, 2)->default(0)->after('special_price_discount_percentage');
            }
            if (! Schema::hasColumn('users', 'customer_level')) {
                $table->unsignedTinyInteger('customer_level')->default(1)->after('reseller_markup_percentage');
            }
            if (! Schema::hasColumn('users', 'api_enabled')) {
                $table->boolean('api_enabled')->default(false)->after('customer_level');
            }
            if (! Schema::hasColumn('users', 'api_token')) {
                $table->string('api_token', 100)->nullable()->unique()->after('api_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['api_token', 'api_enabled', 'customer_level', 'reseller_markup_percentage'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

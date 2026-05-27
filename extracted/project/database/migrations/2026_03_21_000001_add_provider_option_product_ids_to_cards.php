<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'provider_option_product_ids')) {
                $table->json('provider_option_product_ids')->nullable()->after('option_costs');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (Schema::hasColumn('cards', 'provider_option_product_ids')) {
                $table->dropColumn('provider_option_product_ids');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('imported_provider_products')) {
            if (Schema::hasColumn('imported_provider_products', 'min_amount')) {
                DB::statement("ALTER TABLE `imported_provider_products` MODIFY `min_amount` DECIMAL(30,8) NULL");
            }

            if (Schema::hasColumn('imported_provider_products', 'max_amount')) {
                DB::statement("ALTER TABLE `imported_provider_products` MODIFY `max_amount` DECIMAL(30,8) NULL");
            }
        }

        if (Schema::hasTable('cards')) {
            if (Schema::hasColumn('cards', 'minAmount')) {
                DB::statement("ALTER TABLE `cards` MODIFY `minAmount` DECIMAL(30,8) NULL");
            }

            if (Schema::hasColumn('cards', 'maxAmount')) {
                DB::statement("ALTER TABLE `cards` MODIFY `maxAmount` DECIMAL(30,8) NULL");
            }
        }
    }

    public function down(): void
    {
        // Safe no-op: do not shrink columns back because provider limits may exceed integer ranges.
    }
};

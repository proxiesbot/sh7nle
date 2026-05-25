<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'provider_source_id')) {
                $table->foreignId('provider_source_id')->nullable()->after('subcategory_id')->constrained('provider_sources')->nullOnDelete();
            }
            if (! Schema::hasColumn('cards', 'provider_product_id')) {
                $table->string('provider_product_id')->nullable()->after('sawaCardId');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (Schema::hasColumn('cards', 'provider_source_id')) {
                $table->dropConstrainedForeignId('provider_source_id');
            }
            if (Schema::hasColumn('cards', 'provider_product_id')) {
                $table->dropColumn('provider_product_id');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'subcategory_id')) {
                $table->foreignId('subcategory_id')->nullable()->after('section_id')->constrained('subcategories')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (Schema::hasColumn('cards', 'subcategory_id')) {
                $table->dropConstrainedForeignId('subcategory_id');
            }
        });
    }
};

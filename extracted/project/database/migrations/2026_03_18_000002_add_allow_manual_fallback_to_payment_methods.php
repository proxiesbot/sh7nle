<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_methods', 'allow_manual_fallback')) {
                $table->boolean('allow_manual_fallback')->default(false)->after('is_automatic');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            if (Schema::hasColumn('payment_methods', 'allow_manual_fallback')) {
                $table->dropColumn('allow_manual_fallback');
            }
        });
    }
};

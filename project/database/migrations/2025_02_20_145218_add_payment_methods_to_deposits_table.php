<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('deposits', function (Blueprint $table) {
            $table->foreignIdFor(\App\Models\PaymentMethod::class)->after('paymentId');
            $table->text('image')->nullable()->after('payment_method_id');
            $table->text('notes')->nullable()->after('image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deposits', function (Blueprint $table) {
            $table->dropColumn('payment_method_id');
            $table->dropColumn('image');
            $table->dropColumn('notes');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('gift_cards')) {
            Schema::create('gift_cards', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->decimal('amount', 20, 8);
                $table->string('status')->default('active');
                $table->foreignId('buyer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('redeemed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('redeemed_at')->nullable();
                $table->string('source')->default('purchase');
                $table->json('meta')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_cards');
    }
};

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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(\App\Models\User::class);
            $table->foreignIdFor(\App\Models\Card::class);
            $table->string('destinationProfileId');   // the user id for the account that he is buying the card for
            $table->string('orderId');  // the order id sent from Sawa Card, we can use it to check the order later if any problem happened
            $table->integer('amount');
            $table->decimal('price', 12, 2);
            $table->integer('status')->default(0); // 0: pending, 1: success, 2: error
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

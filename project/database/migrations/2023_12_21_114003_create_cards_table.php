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
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignIdFor(\App\Models\Section::class)->default(0);
            $table->text('background')->nullable();
            $table->text('icon');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('minAmount')->default(1);
            $table->integer('maxAmount')->default(1);
            $table->integer('discount')->default(0);
            $table->string('sawaCardId');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};

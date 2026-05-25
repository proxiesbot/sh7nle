<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('wheel_prizes')) {
            Schema::create('wheel_prizes', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type')->default('nothing');
                $table->decimal('value', 20, 8)->default(0);
                $table->unsignedInteger('weight')->default(1);
                $table->decimal('min_order_amount', 20, 8)->default(0);
                $table->boolean('is_active')->default(true);
                $table->json('meta')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'wheel_spins')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedInteger('wheel_spins')->default(0);
            });
        }

        if (Schema::hasTable('wheel_prizes') && DB::table('wheel_prizes')->count() === 0) {
            DB::table('wheel_prizes')->insert([
                [
                    'name' => 'حظ أوفر',
                    'type' => 'nothing',
                    'value' => 0,
                    'weight' => 45,
                    'min_order_amount' => 0,
                    'is_active' => true,
                    'meta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'حظ أوفر مرة ثانية',
                    'type' => 'nothing',
                    'value' => 0,
                    'weight' => 30,
                    'min_order_amount' => 0,
                    'is_active' => true,
                    'meta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'خصم 5% لطلب 10$ وما فوق',
                    'type' => 'discount_percent',
                    'value' => 5,
                    'weight' => 10,
                    'min_order_amount' => 10,
                    'is_active' => true,
                    'meta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'رصيد 1$',
                    'type' => 'balance',
                    'value' => 1,
                    'weight' => 4,
                    'min_order_amount' => 0,
                    'is_active' => true,
                    'meta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'غيفت كارد 5$',
                    'type' => 'gift_card',
                    'value' => 5,
                    'weight' => 1,
                    'min_order_amount' => 0,
                    'is_active' => true,
                    'meta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wheel_prizes');
    }
};

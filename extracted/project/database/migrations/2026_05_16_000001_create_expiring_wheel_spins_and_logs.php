<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('wheel_spins')) {
            Schema::create('wheel_spins', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('source')->default('admin');
                $table->string('status')->default('active');
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('consumed_at')->nullable();
                $table->foreignId('created_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status', 'expires_at']);
            });
        }

        if (! Schema::hasTable('wheel_spin_logs')) {
            Schema::create('wheel_spin_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('wheel_spin_id')->nullable()->constrained('wheel_spins')->nullOnDelete();
                $table->foreignId('wheel_prize_id')->nullable()->constrained('wheel_prizes')->nullOnDelete();
                $table->string('action')->default('spin');
                $table->string('prize_name')->nullable();
                $table->string('prize_type')->nullable();
                $table->decimal('prize_value', 20, 8)->default(0);
                $table->text('message')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
            });
        }

        if (Schema::hasTable('wheel_prizes')) {
            $now = now();
            $prizes = [
                ['name' => 'حظ أوفر', 'type' => 'nothing', 'value' => 0, 'weight' => 30, 'min_order_amount' => 0],
                ['name' => 'حظ أوفر مرة ثانية', 'type' => 'nothing', 'value' => 0, 'weight' => 25, 'min_order_amount' => 0],
                ['name' => 'قريبًا تربح', 'type' => 'nothing', 'value' => 0, 'weight' => 20, 'min_order_amount' => 0],
                ['name' => 'جرب مرة أخرى لاحقًا', 'type' => 'nothing', 'value' => 0, 'weight' => 15, 'min_order_amount' => 0],
                ['name' => 'بدون جائزة هذه المرة', 'type' => 'nothing', 'value' => 0, 'weight' => 12, 'min_order_amount' => 0],
                ['name' => 'رصيد 1$', 'type' => 'balance', 'value' => 1, 'weight' => 15, 'min_order_amount' => 0],
                ['name' => 'خصم 5% لطلب 10$ وما فوق', 'type' => 'discount_percent', 'value' => 5, 'weight' => 10, 'min_order_amount' => 10],
                ['name' => 'غيفت كارد 5$', 'type' => 'gift_card', 'value' => 5, 'weight' => 2, 'min_order_amount' => 0],
                ['name' => 'الجائزة الكبرى 100$', 'type' => 'grand_locked', 'value' => 100, 'weight' => 0, 'min_order_amount' => 0],
            ];

            foreach ($prizes as $prize) {
                DB::table('wheel_prizes')->updateOrInsert(
                    ['name' => $prize['name']],
                    [
                        'type' => $prize['type'],
                        'value' => $prize['value'],
                        'weight' => $prize['weight'],
                        'min_order_amount' => $prize['min_order_amount'],
                        'is_active' => true,
                        'meta' => json_encode(['v28_5' => true]),
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wheel_spin_logs');
        Schema::dropIfExists('wheel_spins');
    }
};

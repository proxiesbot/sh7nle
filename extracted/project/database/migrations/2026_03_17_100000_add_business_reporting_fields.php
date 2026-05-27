<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_blocked')) {
                $table->boolean('is_blocked')->default(false)->after('balance');
            }
            if (! Schema::hasColumn('users', 'special_price_discount_percentage')) {
                $table->decimal('special_price_discount_percentage', 5, 2)->default(0)->after('is_blocked');
            }
            if (! Schema::hasColumn('users', 'referral_rate_percentage')) {
                $table->decimal('referral_rate_percentage', 5, 2)->default(3)->after('special_price_discount_percentage');
            }
            if (! Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code')->nullable()->unique()->after('referral_rate_percentage');
            }
            if (! Schema::hasColumn('users', 'referred_by_user_id')) {
                $table->foreignId('referred_by_user_id')->nullable()->after('referral_code')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('users', 'referral_balance')) {
                $table->decimal('referral_balance', 12, 2)->default(0)->after('referred_by_user_id');
            }
            if (! Schema::hasColumn('users', 'total_referral_earnings')) {
                $table->decimal('total_referral_earnings', 12, 2)->default(0)->after('referral_balance');
            }
        });

        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->default(0)->after('price');
            }
            if (! Schema::hasColumn('cards', 'provider_cost_price')) {
                $table->decimal('provider_cost_price', 12, 2)->nullable()->after('cost_price');
            }
            if (! Schema::hasColumn('cards', 'price_adjustment_percentage')) {
                $table->decimal('price_adjustment_percentage', 5, 2)->default(0)->after('provider_cost_price');
            }
            if (! Schema::hasColumn('cards', 'profit_percentage')) {
                $table->decimal('profit_percentage', 5, 2)->default(0)->after('price_adjustment_percentage');
            }
            if (! Schema::hasColumn('cards', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('profit_percentage');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'support_id')) {
                $table->string('support_id')->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('payments', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->default(0)->after('price');
            }
            if (! Schema::hasColumn('payments', 'profit_amount')) {
                $table->decimal('profit_amount', 12, 2)->default(0)->after('cost_price');
            }
            if (! Schema::hasColumn('payments', 'referral_commission_amount')) {
                $table->decimal('referral_commission_amount', 12, 2)->default(0)->after('profit_amount');
            }
            if (! Schema::hasColumn('payments', 'referral_commission_paid_at')) {
                $table->timestamp('referral_commission_paid_at')->nullable()->after('referral_commission_amount');
            }
        });

        Schema::table('deposits', function (Blueprint $table) {
            if (! Schema::hasColumn('deposits', 'support_id')) {
                $table->string('support_id')->nullable()->unique()->after('id');
            }
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_methods', 'available_for_referral_withdrawal')) {
                $table->boolean('available_for_referral_withdrawal')->default(false)->after('requires_image');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('notifications', 'title')) {
                $table->string('title')->nullable()->after('id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (Schema::hasColumn('notifications', 'title')) {
                $table->dropColumn('title');
            }
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            if (Schema::hasColumn('payment_methods', 'available_for_referral_withdrawal')) {
                $table->dropColumn('available_for_referral_withdrawal');
            }
        });

        Schema::table('deposits', function (Blueprint $table) {
            if (Schema::hasColumn('deposits', 'support_id')) {
                $table->dropColumn('support_id');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('payments', 'support_id') ? 'support_id' : null,
                Schema::hasColumn('payments', 'cost_price') ? 'cost_price' : null,
                Schema::hasColumn('payments', 'profit_amount') ? 'profit_amount' : null,
                Schema::hasColumn('payments', 'referral_commission_amount') ? 'referral_commission_amount' : null,
                Schema::hasColumn('payments', 'referral_commission_paid_at') ? 'referral_commission_paid_at' : null,
            ]);
            if ($columns) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('cards', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('cards', 'cost_price') ? 'cost_price' : null,
                Schema::hasColumn('cards', 'provider_cost_price') ? 'provider_cost_price' : null,
                Schema::hasColumn('cards', 'price_adjustment_percentage') ? 'price_adjustment_percentage' : null,
                Schema::hasColumn('cards', 'profit_percentage') ? 'profit_percentage' : null,
                Schema::hasColumn('cards', 'is_active') ? 'is_active' : null,
            ]);
            if ($columns) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'referred_by_user_id')) {
                $table->dropConstrainedForeignId('referred_by_user_id');
            }
            $columns = array_filter([
                Schema::hasColumn('users', 'is_blocked') ? 'is_blocked' : null,
                Schema::hasColumn('users', 'special_price_discount_percentage') ? 'special_price_discount_percentage' : null,
                Schema::hasColumn('users', 'referral_rate_percentage') ? 'referral_rate_percentage' : null,
                Schema::hasColumn('users', 'referral_code') ? 'referral_code' : null,
                Schema::hasColumn('users', 'referral_balance') ? 'referral_balance' : null,
                Schema::hasColumn('users', 'total_referral_earnings') ? 'total_referral_earnings' : null,
            ]);
            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};

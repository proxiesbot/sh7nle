<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            foreach ([
                'cards.price',
                'cards.cost_price',
                'cards.provider_cost_price',
                'payments.price',
                'payments.cost_price',
                'payments.profit_amount',
                'payments.referral_commission_amount',
                'deposits.amount',
                'users.balance',
            ] as $column) {
                [$table, $field] = explode('.', $column);
                if (DB::getSchemaBuilder()->hasColumn($table, $field)) {
                    DB::statement("ALTER TABLE {$table} MODIFY {$field} DECIMAL(20,8) NOT NULL DEFAULT 0");
                }
            }
        } elseif ($driver === 'pgsql') {
            foreach ([
                'cards.price',
                'cards.cost_price',
                'cards.provider_cost_price',
                'payments.price',
                'payments.cost_price',
                'payments.profit_amount',
                'payments.referral_commission_amount',
                'deposits.amount',
                'users.balance',
            ] as $column) {
                [$table, $field] = explode('.', $column);
                if (DB::getSchemaBuilder()->hasColumn($table, $field)) {
                    DB::statement("ALTER TABLE {$table} ALTER COLUMN {$field} TYPE NUMERIC(20,8)");
                }
            }
        }

        // SQLite stores numeric values dynamically, so no table rebuild is needed.
    }

    public function down(): void
    {
        // no-op
    }
};

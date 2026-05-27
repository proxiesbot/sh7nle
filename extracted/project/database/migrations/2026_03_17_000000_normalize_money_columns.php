<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY balance DECIMAL(20,8) NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE cards MODIFY price DECIMAL(20,8) NOT NULL');
            DB::statement('ALTER TABLE payments MODIFY price DECIMAL(20,8) NOT NULL');
            DB::statement('ALTER TABLE deposits MODIFY amount DECIMAL(20,8) NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(20,8)');
            DB::statement('ALTER TABLE cards ALTER COLUMN price TYPE NUMERIC(20,8)');
            DB::statement('ALTER TABLE payments ALTER COLUMN price TYPE NUMERIC(20,8)');
            DB::statement('ALTER TABLE deposits ALTER COLUMN amount TYPE NUMERIC(20,8)');
        }
    }

    public function down(): void
    {
        // no-op
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payments') || ! Schema::hasColumn('payments', 'orderUuid')) {
            return;
        }

        DB::table('payments')
            ->select('orderUuid')
            ->whereNotNull('orderUuid')
            ->where('orderUuid', '!=', '')
            ->groupBy('orderUuid')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->each(function ($row) {
                $keepId = DB::table('payments')->where('orderUuid', $row->orderUuid)->min('id');

                DB::table('payments')
                    ->where('orderUuid', $row->orderUuid)
                    ->where('id', '!=', $keepId)
                    ->orderBy('id')
                    ->get()
                    ->each(function ($payment) {
                        DB::table('payments')
                            ->where('id', $payment->id)
                            ->update([
                                'orderUuid' => $payment->orderUuid . '-dup-' . $payment->id,
                                'updated_at' => now(),
                            ]);
                    });
            });

        Schema::table('payments', function (Blueprint $table) {
            $table->unique('orderUuid', 'payments_orderuuid_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            try {
                $table->dropUnique('payments_orderuuid_unique');
            } catch (Throwable $e) {
                // no-op
            }
        });
    }
};

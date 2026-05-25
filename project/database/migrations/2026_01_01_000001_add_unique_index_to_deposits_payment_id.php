<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('deposits') || ! Schema::hasColumn('deposits', 'paymentId')) {
            return;
        }

        DB::table('deposits')
            ->select('paymentId')
            ->whereNotNull('paymentId')
            ->where('paymentId', '!=', '')
            ->groupBy('paymentId')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->each(function ($row) {
                $keepId = DB::table('deposits')->where('paymentId', $row->paymentId)->min('id');

                DB::table('deposits')
                    ->where('paymentId', $row->paymentId)
                    ->where('id', '!=', $keepId)
                    ->orderBy('id')
                    ->get()
                    ->each(function ($deposit) {
                        DB::table('deposits')
                            ->where('id', $deposit->id)
                            ->update([
                                'paymentId' => $deposit->paymentId . '-dup-' . $deposit->id,
                                'updated_at' => now(),
                            ]);
                    });
            });

        Schema::table('deposits', function (Blueprint $table) {
            $table->unique('paymentId', 'deposits_paymentid_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('deposits')) {
            return;
        }

        Schema::table('deposits', function (Blueprint $table) {
            try {
                $table->dropUnique('deposits_paymentid_unique');
            } catch (\Throwable $e) {
                // no-op
            }
        });
    }
};

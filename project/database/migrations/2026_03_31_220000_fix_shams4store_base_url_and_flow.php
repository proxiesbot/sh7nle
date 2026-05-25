<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('provider_sources')
            ->where('slug', 'shams4store')
            ->update([
                'base_url' => 'https://api.shams4store.com/client/api',
                'updated_at' => now(),
            ]);

        DB::table('cards')
            ->where(function ($query) {
                $query->whereNull('purchase_flow')->orWhere('purchase_flow', '');
            })
            ->update(['purchase_flow' => 'direct_purchase']);
    }

    public function down(): void
    {
        DB::table('provider_sources')
            ->where('slug', 'shams4store')
            ->update([
                'base_url' => 'https://api.shams4store.com/client/api',
                'updated_at' => now(),
            ]);
    }
};

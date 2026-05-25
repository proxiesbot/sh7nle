<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'purchase_flow')) {
                $table->string('purchase_flow')->default('player_category')->after('provider_params');
            }
            if (! Schema::hasColumn('cards', 'requires_secondary_player_id')) {
                $table->boolean('requires_secondary_player_id')->default(false)->after('purchase_flow');
            }
            if (! Schema::hasColumn('cards', 'secondary_player_id_label')) {
                $table->string('secondary_player_id_label')->nullable()->after('requires_secondary_player_id');
            }
            if (! Schema::hasColumn('cards', 'option_prices')) {
                $table->json('option_prices')->nullable()->after('secondary_player_id_label');
            }
            if (! Schema::hasColumn('cards', 'option_costs')) {
                $table->json('option_costs')->nullable()->after('option_prices');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $drops = [];
            foreach (['purchase_flow', 'requires_secondary_player_id', 'secondary_player_id_label', 'option_prices', 'option_costs'] as $column) {
                if (Schema::hasColumn('cards', $column)) {
                    $drops[] = $column;
                }
            }
            if ($drops) {
                $table->dropColumn($drops);
            }
        });
    }
};

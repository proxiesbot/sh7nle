<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cards')) {
            return;
        }

        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('section_id')->index();
            }
        });

        DB::table('cards')->whereNull('sort_order')->update(['sort_order' => 0]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('cards') || ! Schema::hasColumn('cards', 'sort_order')) {
            return;
        }

        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};

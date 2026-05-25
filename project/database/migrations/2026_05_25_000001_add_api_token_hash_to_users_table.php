<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds api_token_hash column for secure hashed API token storage.
 * The existing api_token column is kept for backward compatibility during transition.
 * After all users regenerate tokens, the plain api_token column can be dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'api_token_hash')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('api_token_hash', 255)->nullable()->after('api_token');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'api_token_hash')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('api_token_hash');
            });
        }
    }
};

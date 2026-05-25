<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $provider = DB::table('provider_sources')->where('slug', 'shams4store')->first();
        if (! $provider) {
            return;
        }

        $config = json_decode($provider->config ?? '{}', true) ?: [];
        $config['verify_ssl'] = false;
        DB::table('provider_sources')->where('id', $provider->id)->update(['config' => json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }

    public function down(): void
    {
        $provider = DB::table('provider_sources')->where('slug', 'shams4store')->first();
        if (! $provider) {
            return;
        }

        $config = json_decode($provider->config ?? '{}', true) ?: [];
        unset($config['verify_ssl']);
        DB::table('provider_sources')->where('id', $provider->id)->update(['config' => json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }
};

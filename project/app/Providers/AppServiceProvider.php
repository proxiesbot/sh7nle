<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        try {
            if (Schema::hasTable('settings')) {
                $fromAddress = Setting::get('mail.from_address', null);
                $fromName = Setting::get('mail.from_name', null);
                $host = Setting::get('mail.host', null);
                $port = Setting::get('mail.port', null);
                $username = Setting::get('mail.username', null);

                if ($fromAddress) {
                    config(['mail.from.address' => $fromAddress]);
                }
                if ($fromName) {
                    config(['mail.from.name' => $fromName]);
                }
                if ($host) {
                    config(['mail.mailers.smtp.host' => $host]);
                }
                if ($port) {
                    config(['mail.mailers.smtp.port' => $port]);
                }
                if ($username) {
                    config(['mail.mailers.smtp.username' => $username]);
                }
            }
        } catch (\Throwable $exception) {
            // Avoid breaking the site if settings table is unavailable during migrations.
        }
    }
}

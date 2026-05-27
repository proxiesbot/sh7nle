<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('pricing.global_markup_percentage', 0, 'float', 'pricing');
        Setting::set('levels.level2_threshold', 250, 'float', 'levels');
        Setting::set('levels.level3_threshold', 1000, 'float', 'levels');
        Setting::set('banners.autoplay_seconds', 5, 'integer', 'banners');
        Setting::set('features.referrals_enabled', false, 'boolean', 'features');
    }
}

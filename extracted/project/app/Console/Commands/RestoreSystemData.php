<?php

namespace App\Console\Commands;

use App\Models\ProviderSource;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RestoreSystemData extends Command
{
    protected $signature = 'sh7nle:restore-system-data {--keep-tokens : Preserve existing provider tokens when restoring providers}';

    protected $description = 'Restore critical Sh7nle system data after database cleanup: providers, gift cards, wheel prizes, payment methods, roles, and basic repairs.';

    public function handle(): int
    {
        $this->info('Restoring Sh7nle critical system data...');

        $this->fixAmountColumns();
        $this->restoreRoles();
        $this->restoreProviders();
        $this->restorePaymentMethods();
        $this->restoreGiftCards();
        $this->restoreWheelPrizes();
        $this->restoreSettings();
        $this->repairPayments();
        $this->repairImportedProducts();

        $this->info('Done. Critical system data is ready.');

        return self::SUCCESS;
    }

    protected function fixAmountColumns(): void
    {
        if (Schema::hasTable('imported_provider_products')) {
            DB::statement('ALTER TABLE `imported_provider_products` MODIFY `min_amount` DECIMAL(30,8) NULL');
            DB::statement('ALTER TABLE `imported_provider_products` MODIFY `max_amount` DECIMAL(30,8) NULL');
            $this->line('✓ imported_provider_products amount columns are wide enough.');
        }

        if (Schema::hasTable('cards')) {
            if (Schema::hasColumn('cards', 'minAmount')) {
                DB::statement('ALTER TABLE `cards` MODIFY `minAmount` DECIMAL(30,8) NULL');
            }
            if (Schema::hasColumn('cards', 'maxAmount')) {
                DB::statement('ALTER TABLE `cards` MODIFY `maxAmount` DECIMAL(30,8) NULL');
            }
            $this->line('✓ cards amount columns are wide enough.');
        }
    }

    protected function restoreRoles(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        foreach (['Super-Admin', 'admin', 'Admin', 'superadmin', 'super-admin', 'Normal', 'Seller'] as $roleName) {
            Role::query()->firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->line('✓ Roles restored.');
    }

    protected function restoreProviders(): void
    {
        if (! Schema::hasTable('provider_sources')) {
            return;
        }

        ProviderSource::query()->whereIn('slug', ['sawa5card', 'shams4store'])->delete();

        $existingShams = ProviderSource::query()->where('slug', 'shams-store')->first();
        $existingSw = ProviderSource::query()->where('slug', 'sw-games')->first();
        $keepTokens = (bool) $this->option('keep-tokens');

        ProviderSource::query()->updateOrCreate(
            ['slug' => 'shams-store'],
            [
                'name' => 'Shams Store',
                'driver' => 'sawa',
                'base_url' => 'https://api.shams4store.com/client/api',
                'api_token' => $keepTokens && filled($existingShams?->getRawOriginal('api_token')) ? $existingShams->getRawOriginal('api_token') : (env('SHAMS_API_TOKEN') ?: env('SAWA_CARD_API_TOKEN')),
                'auth_header' => 'api-token',
                'auth_prefix' => null,
                'catalog_endpoint' => '/content/{parentId}',
                'product_endpoint' => '/products?products_id={id}',
                'order_endpoint' => '/newOrder/{id}/params',
                'check_endpoint' => '/check',
                'supports_catalog' => true,
                'is_active' => true,
                'config' => [
                    'order_data_path' => 'data',
                    'verify_ssl' => true,
                    'field_map' => [
                        'id' => 'id',
                        'name' => 'name',
                        'price' => 'price',
                        'base_price' => 'base_price',
                        'product_type' => 'product_type',
                        'params' => 'params',
                        'qty_values' => 'qty_values',
                        'category_name' => 'category_name',
                        'parent_id' => 'parent_id',
                        'image' => 'category_img',
                        'available' => 'available',
                    ],
                ],
            ]
        );

        ProviderSource::query()->updateOrCreate(
            ['slug' => 'sw-games'],
            [
                'name' => 'SW Games',
                'driver' => 'swgames',
                'base_url' => env('SW_GAMES_BASE_URL', 'https://sw-games.net/api/fastapi'),
                'api_token' => $keepTokens && filled($existingSw?->getRawOriginal('api_token')) ? $existingSw->getRawOriginal('api_token') : env('SW_GAMES_API_TOKEN'),
                'auth_header' => 'apiToken',
                'auth_prefix' => null,
                'catalog_endpoint' => '/products',
                'product_endpoint' => '/products',
                'order_endpoint' => '/requestorder/{id}/params',
                'check_endpoint' => '/checkorders',
                'supports_catalog' => true,
                'is_active' => true,
                'config' => [
                    'order_data_path' => 'data',
                    'verify_ssl' => true,
                    'field_map' => [
                        'id' => 'id',
                        'name' => 'name',
                        'price' => 'price',
                        'base_price' => 'price',
                        'image' => 'image',
                        'available' => 'isActive',
                        'game_id' => 'game_id',
                        'game_name' => 'gameName',
                        'min_count' => 'minCount',
                        'max_count' => 'maxCount',
                        'currency' => 'currency',
                        'dynamic_fields' => 'daynamicFields',
                    ],
                ],
            ]
        );

        $this->line('✓ Provider sources restored.');
    }

    protected function restorePaymentMethods(): void
    {
        if (! Schema::hasTable('payment_methods')) {
            return;
        }

        $methods = [
            ['provider' => 'syriatel_cash', 'name' => 'Syriatel Cash', 'account' => 'أضف رقم سيرياتيل كاش من لوحة الإدارة', 'notes' => 'يرجى إرسال رقم العملية أو صورة التحويل بعد الدفع.', 'status' => true, 'is_automatic' => false, 'requires_payment_id' => true, 'requires_image' => true, 'available_for_referral_withdrawal' => true, 'config' => ['provider' => 'syriatel_cash']],
            ['provider' => 'sham_cash', 'name' => 'ShamCash', 'account' => 'أضف بيانات ShamCash من لوحة الإدارة', 'notes' => 'طريقة دفع يدوية قابلة للتعديل.', 'status' => true, 'is_automatic' => false, 'requires_payment_id' => true, 'requires_image' => true, 'available_for_referral_withdrawal' => true, 'config' => ['provider' => 'sham_cash']],
            ['provider' => 'kazawallet', 'name' => 'KazaWallet', 'account' => env('KAZAWALLET_EMAIL', 'merchant@example.com'), 'notes' => 'أضف رابط أو بيانات KazaWallet من لوحة الإدارة.', 'status' => true, 'is_automatic' => false, 'requires_payment_id' => true, 'requires_image' => true, 'available_for_referral_withdrawal' => true, 'config' => ['provider' => 'kazawallet']],
            ['provider' => 'manual', 'name' => 'تحويل يدوي', 'account' => 'أضف رقم الحساب أو عنوان المحفظة من لوحة الإدارة.', 'notes' => 'طريقة دفع يدوية عامة.', 'status' => true, 'is_automatic' => false, 'requires_payment_id' => true, 'requires_image' => true, 'available_for_referral_withdrawal' => true, 'config' => ['provider' => 'manual']],
            ['provider' => 'binance_pay', 'name' => 'Binance Pay', 'account' => 'أضف بيانات Binance من لوحة الإدارة', 'notes' => 'هيكل جاهز للإعداد.', 'status' => false, 'is_automatic' => true, 'requires_payment_id' => true, 'requires_image' => false, 'available_for_referral_withdrawal' => false, 'config' => ['currency' => 'USDT']],
            ['provider' => 'coinex', 'name' => 'CoinEx', 'account' => 'أضف بيانات CoinEx من لوحة الإدارة', 'notes' => 'هيكل جاهز للإعداد.', 'status' => false, 'is_automatic' => true, 'requires_payment_id' => true, 'requires_image' => false, 'available_for_referral_withdrawal' => false, 'config' => ['currency' => 'USDT']],
            ['provider' => 'faucetpay', 'name' => 'FaucetPay', 'account' => 'أضف بيانات FaucetPay من لوحة الإدارة', 'notes' => 'هيكل جاهز للإعداد.', 'status' => false, 'is_automatic' => true, 'requires_payment_id' => true, 'requires_image' => false, 'available_for_referral_withdrawal' => false, 'config' => ['currency' => 'USDT']],
            ['provider' => 'crypto_payment', 'name' => 'CryptoPayment', 'account' => 'أضف بيانات بوابة الكريبتو من لوحة الإدارة', 'notes' => 'هيكل عام لبوابات الكريبتو.', 'status' => false, 'is_automatic' => true, 'requires_payment_id' => true, 'requires_image' => false, 'available_for_referral_withdrawal' => false, 'config' => ['currency' => 'USDT']],
        ];

        foreach ($methods as $method) {
            $existing = DB::table('payment_methods')->where('provider', $method['provider'])->first();
            DB::table('payment_methods')->updateOrInsert(
                ['provider' => $method['provider']],
                array_merge($method, [
                    'account' => filled($existing?->account ?? null) ? $existing->account : $method['account'],
                    'notes' => filled($existing?->notes ?? null) ? $existing->notes : $method['notes'],
                    'config' => json_encode($method['config'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                    'created_at' => $existing->created_at ?? now(),
                ])
            );
        }

        $this->line('✓ Payment methods restored.');
    }

    protected function restoreGiftCards(): void
    {
        if (! Schema::hasTable('sections') || ! Schema::hasTable('cards')) {
            return;
        }

        $sectionId = DB::table('sections')->where('name', 'Sh7nle Gift Cards')->value('id');
        if (! $sectionId) {
            $sectionId = DB::table('sections')->insertGetId([
                'name' => 'Sh7nle Gift Cards',
                'description' => 'بطاقات رصيد داخلية خاصة بمنصة Sh7nle، يمكن شراؤها وإهداؤها أو استردادها من زر Gift Card.',
                'section_id' => 0,
                'icon' => '/demo/products/sh7nle-gift-card.svg',
                'background' => '/demo/products/sh7nle-gift-card.svg',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ([5, 10, 15, 20, 25, 50] as $amount) {
            DB::table('cards')->updateOrInsert(
                ['name' => "Sh7nle Gift Card {$amount}$"],
                [
                    'section_id' => $sectionId,
                    'description' => "بطاقة شحنلي بقيمة {$amount}$ تظهر ككود داخل طلباتي ويمكن استردادها من زر Gift Card أو إرسالها لشخص آخر.",
                    'price' => $amount,
                    'cost_price' => $amount,
                    'provider_cost_price' => $amount,
                    'price_adjustment_percentage' => 0,
                    'profit_percentage' => 0,
                    'minAmount' => 1,
                    'maxAmount' => 20,
                    'discount' => 0,
                    'sawaCardId' => '0',
                    'provider_source_id' => null,
                    'provider_product_id' => null,
                    'icon' => '/demo/products/sh7nle-gift-card.svg',
                    'background' => '/demo/products/sh7nle-gift-card.svg',
                    'requires_player_id' => false,
                    'requires_secondary_player_id' => false,
                    'quantity_label' => 'عدد البطاقات',
                    'amount_mode' => 'quantity',
                    'delivery_mode' => 'internal_gift_card',
                    'provider_product_type' => 'internal_gift_card',
                    'provider_qty_values' => json_encode([$amount], JSON_UNESCAPED_UNICODE),
                    'provider_params' => json_encode([], JSON_UNESCAPED_UNICODE),
                    'purchase_flow' => 'codes_quantity',
                    'option_prices' => json_encode([(string) $amount => $amount], JSON_UNESCAPED_UNICODE),
                    'option_costs' => json_encode([(string) $amount => $amount], JSON_UNESCAPED_UNICODE),
                    'provider_option_product_ids' => null,
                    'is_active' => true,
                    'manual_unavailable' => false,
                    'provider_unavailable_at' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        $this->line('✓ System Gift Cards restored.');
    }

    protected function restoreWheelPrizes(): void
    {
        if (! Schema::hasTable('wheel_prizes')) {
            return;
        }

        $prizes = [
            ['name' => 'حظ أوفر', 'type' => 'nothing', 'value' => 0, 'weight' => 30, 'min_order_amount' => 0],
            ['name' => 'حظ أوفر مرة ثانية', 'type' => 'nothing', 'value' => 0, 'weight' => 25, 'min_order_amount' => 0],
            ['name' => 'قريبًا تربح', 'type' => 'nothing', 'value' => 0, 'weight' => 20, 'min_order_amount' => 0],
            ['name' => 'جرب مرة أخرى لاحقًا', 'type' => 'nothing', 'value' => 0, 'weight' => 15, 'min_order_amount' => 0],
            ['name' => 'بدون جائزة هذه المرة', 'type' => 'nothing', 'value' => 0, 'weight' => 12, 'min_order_amount' => 0],
            ['name' => 'رصيد 1$', 'type' => 'balance', 'value' => 1, 'weight' => 10, 'min_order_amount' => 0],
            ['name' => 'خصم 5%', 'type' => 'discount_percent', 'value' => 5, 'weight' => 10, 'min_order_amount' => 10],
            ['name' => 'غيفت كارد 5$', 'type' => 'gift_card', 'value' => 5, 'weight' => 2, 'min_order_amount' => 0],
            ['name' => 'الجائزة الكبرى 100$', 'type' => 'grand_locked', 'value' => 100, 'weight' => 0, 'min_order_amount' => 0],
        ];

        foreach ($prizes as $prize) {
            DB::table('wheel_prizes')->updateOrInsert(
                ['name' => $prize['name']],
                array_merge($prize, [
                    'is_active' => true,
                    'meta' => json_encode(['system' => true], JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                    'created_at' => now(),
                ])
            );
        }

        $this->line('✓ Wheel prizes restored.');
    }

    protected function restoreSettings(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        $defaults = [
            'features.referrals_enabled' => '1',
            'social.facebook_url' => '',
            'social.instagram_url' => '',
            'social.telegram_url' => '',
            'social.whatsapp_url' => '',
            'social.support_url' => '',
            'support.live_chat_enabled' => '1',
        ];

        foreach ($defaults as $key => $value) {
            if (! Setting::query()->where('key', $key)->exists()) {
                Setting::query()->create(['key' => $key, 'value' => $value]);
            }
        }

        $this->line('✓ Essential settings checked.');
    }

    protected function repairPayments(): void
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        DB::table('payments')
            ->where(function ($query) {
                $query->whereNull('orderId')->orWhere('orderId', '');
            })
            ->orderBy('id')
            ->get(['id', 'support_id'])
            ->each(function ($payment) {
                DB::table('payments')->where('id', $payment->id)->update([
                    'orderId' => $payment->support_id ?: ('ORD-' . $payment->id),
                    'updated_at' => now(),
                ]);
            });

        $this->line('✓ Payments repaired.');
    }

    protected function repairImportedProducts(): void
    {
        if (! Schema::hasTable('imported_provider_products')) {
            return;
        }

        DB::table('imported_provider_products')
            ->whereNull('available')
            ->update(['available' => true, 'updated_at' => now()]);

        $this->line('✓ Imported provider products checked.');
    }
}

<?php

use App\Models\PaymentMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payment_methods') && ! Schema::hasColumn('payment_methods', 'icon')) {
            Schema::table('payment_methods', function (Blueprint $table) {
                $table->text('icon')->nullable()->after('image');
            });
        }

        if (! class_exists(PaymentMethod::class) || ! Schema::hasTable('payment_methods')) {
            return;
        }

        foreach ($this->cryptoMethods() as $method) {
            PaymentMethod::query()->updateOrCreate(
                ['provider' => $method['provider']],
                $method
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payment_methods') && Schema::hasColumn('payment_methods', 'icon')) {
            Schema::table('payment_methods', function (Blueprint $table) {
                $table->dropColumn('icon');
            });
        }
    }

    protected function cryptoMethods(): array
    {
        return [
            [
                'name' => 'Binance Pay',
                'icon' => '/images/payment/binance.svg',
                'account' => 'بانتظار إعداد Binance Pay Merchant',
                'notes' => 'هيكلية جاهزة. أضف Merchant ID و API Key و Secret و Webhook Secret من الإعدادات لاحقًا.',
                'status' => false,
                'provider' => 'binance_pay',
                'is_automatic' => true,
                'allow_manual_fallback' => true,
                'requires_payment_id' => true,
                'requires_image' => false,
                'config' => ['currency' => 'USDT', 'mode' => 'merchant_api'],
            ],
            [
                'name' => 'CoinEx',
                'icon' => '/images/payment/coinex.svg',
                'account' => 'بانتظار إعداد CoinEx',
                'notes' => 'هيكلية جاهزة. أضف API Key و Secret أو عنوان المحفظة و callback.',
                'status' => false,
                'provider' => 'coinex',
                'is_automatic' => true,
                'allow_manual_fallback' => true,
                'requires_payment_id' => true,
                'requires_image' => false,
                'config' => ['currency' => 'USDT', 'network' => 'TRC20'],
            ],
            [
                'name' => 'FaucetPay',
                'icon' => '/images/payment/faucetpay.svg',
                'account' => 'بانتظار إعداد FaucetPay',
                'notes' => 'هيكلية جاهزة. أضف API Key و Merchant Username و Callback Secret.',
                'status' => false,
                'provider' => 'faucetpay',
                'is_automatic' => true,
                'allow_manual_fallback' => true,
                'requires_payment_id' => true,
                'requires_image' => false,
                'config' => ['currency' => 'USDT'],
            ],
            [
                'name' => 'CryptoPayment',
                'icon' => '/images/payment/crypto.svg',
                'account' => 'بانتظار إعداد بوابة CryptoPayment',
                'notes' => 'هيكلية عامة لبوابة دفع كريبتو. أضف base_url و API Key و Secret و Webhook Secret.',
                'status' => false,
                'provider' => 'crypto_payment',
                'is_automatic' => true,
                'allow_manual_fallback' => true,
                'requires_payment_id' => true,
                'requires_image' => false,
                'config' => ['currency' => 'USDT'],
            ],
        ];
    }
};

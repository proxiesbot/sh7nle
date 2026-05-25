<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Card;
use App\Models\Deposit;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $gaming = Section::firstOrCreate(
            ['name' => 'الألعاب'],
            [
                'description' => 'شحن الألعاب والخدمات المرتبطة بحسابات اللاعبين.',
                'section_id' => 0,
                'icon' => '/demo/sections/games.svg',
                'background' => '/demo/sections/games.svg',
            ]
        );

        $giftCards = Section::firstOrCreate(
            ['name' => 'بطاقات المتاجر'],
            [
                'description' => 'بطاقات رقمية جاهزة مثل Google Play و Apple و Steam.',
                'section_id' => 0,
                'icon' => '/demo/sections/cards.svg',
                'background' => '/demo/sections/cards.svg',
            ]
        );

        $subscriptions = Section::firstOrCreate(
            ['name' => 'الاشتراكات'],
            [
                'description' => 'اشتراكات وخدمات شهرية قابلة للتوسعة لاحقًا.',
                'section_id' => 0,
                'icon' => '/demo/sections/subscriptions.svg',
                'background' => '/demo/sections/subscriptions.svg',
            ]
        );

        $topupProduct = Card::updateOrCreate(
            ['name' => 'PUBG Global UC مرن'],
            [
                'section_id' => $gaming->id,
                'description' => 'منتج شحن مباشر يحتاج معرف اللاعب وقيمة مرنة.',
                'price' => 0.10,
                'cost_price' => 0.08,
                'provider_cost_price' => 0.08,
                'price_adjustment_percentage' => 10,
                'profit_percentage' => 25,
                'minAmount' => 60,
                'maxAmount' => 3000,
                'sawaCardId' => 365,
                'icon' => '/demo/products/pubg-uc.svg',
                'background' => '/demo/products/pubg-uc.svg',
                'requires_player_id' => true,
                'player_id_label' => 'معرف اللاعب',
                'quantity_label' => 'قيمة UC المطلوبة',
                'amount_mode' => 'custom_value',
                'delivery_mode' => 'api_topup',
                'provider_product_type' => 'amount',
                'provider_qty_values' => ['min' => 60, 'max' => 3000],
                'provider_params' => ['playerId'],
                'is_active' => true,
            ]
        );

        $freeFireProduct = Card::updateOrCreate(
            ['name' => 'Free Fire Diamonds'],
            [
                'section_id' => $gaming->id,
                'description' => 'مثال على منتج فئات ثابتة يحتاج معرف اللاعب.',
                'price' => 4.90,
                'cost_price' => 4.30,
                'provider_cost_price' => 4.30,
                'price_adjustment_percentage' => 10,
                'profit_percentage' => 14,
                'minAmount' => 1,
                'maxAmount' => 1,
                'sawaCardId' => 501,
                'icon' => '/demo/products/freefire.svg',
                'background' => '/demo/products/freefire.svg',
                'requires_player_id' => true,
                'player_id_label' => 'معرف اللاعب',
                'quantity_label' => 'الفئة',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'api_topup',
                'provider_product_type' => 'package',
                'provider_qty_values' => [110, 341, 572],
                'option_prices' => [
                    '110' => 4.90,
                    '341' => 13.50,
                    '572' => 21.90,
                ],
                'option_costs' => [
                    '110' => 4.30,
                    '341' => 12.10,
                    '572' => 19.80,
                ],
                'provider_params' => ['playerId'],
                'purchase_flow' => 'player_category',
                'is_active' => true,
            ]
        );

        $steamProduct = Card::updateOrCreate(
            ['name' => 'Steam Gift Card 20 USD'],
            [
                'section_id' => $giftCards->id,
                'description' => 'بطاقة رقمية بتسليم مباشر داخل صفحة الطلبات.',
                'price' => 21.50,
                'cost_price' => 19.90,
                'provider_cost_price' => 19.90,
                'price_adjustment_percentage' => 6,
                'profit_percentage' => 8,
                'minAmount' => 1,
                'maxAmount' => 10,
                'sawaCardId' => 18,
                'icon' => '/demo/products/steam.svg',
                'background' => '/demo/products/steam.svg',
                'requires_player_id' => false,
                'quantity_label' => 'الكمية',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'api_codes',
                'provider_product_type' => 'package',
                'provider_qty_values' => null,
                'provider_params' => [],
                'purchase_flow' => 'codes_quantity',
                'is_active' => true,
            ]
        );

        $googlePlayProduct = Card::updateOrCreate(
            ['name' => 'Google Play 10 USD'],
            [
                'section_id' => $giftCards->id,
                'description' => 'بطاقة متجر جاهزة للشراء المباشر.',
                'price' => 10.90,
                'cost_price' => 9.60,
                'provider_cost_price' => 9.60,
                'price_adjustment_percentage' => 5,
                'profit_percentage' => 12,
                'minAmount' => 1,
                'maxAmount' => 1,
                'sawaCardId' => 910,
                'icon' => '/demo/products/google-play.svg',
                'background' => '/demo/products/google-play.svg',
                'requires_player_id' => false,
                'quantity_label' => 'الكمية',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'api_codes',
                'provider_product_type' => 'package',
                'provider_qty_values' => null,
                'provider_params' => [],
                'purchase_flow' => 'direct_purchase',
                'is_active' => true,
            ]
        );

        $appleProduct = Card::updateOrCreate(
            ['name' => 'Apple Gift Card 25 USD'],
            [
                'section_id' => $giftCards->id,
                'description' => 'مثال إضافي لعرض الشكل العام في الواجهة.',
                'price' => 26.70,
                'cost_price' => 24.50,
                'provider_cost_price' => 24.50,
                'price_adjustment_percentage' => 5,
                'profit_percentage' => 9,
                'minAmount' => 1,
                'maxAmount' => 1,
                'sawaCardId' => 911,
                'icon' => '/demo/products/apple.svg',
                'background' => '/demo/products/apple.svg',
                'requires_player_id' => false,
                'quantity_label' => 'الكمية',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'api_codes',
                'provider_product_type' => 'package',
                'provider_qty_values' => null,
                'provider_params' => [],
                'purchase_flow' => 'direct_purchase',
                'is_active' => true,
            ]
        );

        Card::updateOrCreate(
            ['name' => 'اشتراك تجريبي شهر واحد'],
            [
                'section_id' => $subscriptions->id,
                'description' => 'منتج تجريبي لعرض قسم اشتراكات بشكل واضح في الواجهة.',
                'price' => 7.50,
                'cost_price' => 6.20,
                'provider_cost_price' => 6.20,
                'price_adjustment_percentage' => 4,
                'profit_percentage' => 10,
                'minAmount' => 1,
                'maxAmount' => 1,
                'sawaCardId' => 1200,
                'icon' => '/demo/sections/subscriptions.svg',
                'background' => '/demo/sections/subscriptions.svg',
                'requires_player_id' => false,
                'quantity_label' => 'الكمية',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'manual_review',
                'provider_product_type' => 'package',
                'provider_qty_values' => null,
                'provider_params' => [],
                'purchase_flow' => 'direct_purchase',
                'is_active' => true,
            ]
        );

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'balance' => 500.00,
            ]
        );
        $user->assignRole('Normal');

        $seller = User::firstOrCreate(
            ['email' => 'seller@example.com'],
            [
                'name' => 'Seller Demo',
                'password' => Hash::make('password'),
                'balance' => 250.00,
                'special_price_discount_percentage' => 12,
                'referral_rate_percentage' => 4,
            ]
        );
        $seller->assignRole('Seller');

        $paymentMethod = PaymentMethod::query()->where('provider', 'kazawallet')->first()
            ?? PaymentMethod::query()->first();

        if ($paymentMethod) {
            Deposit::updateOrCreate(
                ['paymentId' => 'PAY-123456'],
                [
                    'support_id' => 'DEP-DEMO001',
                    'user_id' => $user->id,
                    'amount' => 100.00,
                    'status' => 1,
                    'notes' => 'إيداع تجريبي ناجح.',
                    'payment_method_id' => $paymentMethod->id,
                ]
            );
        }

        Payment::updateOrCreate(
            ['orderId' => 'ORD-TOPUP-001'],
            [
                'support_id' => 'ORD-DEMO001',
                'user_id' => $user->id,
                'card_id' => $topupProduct->id,
                'destinationProfileId' => '123456789',
                'amount' => 120,
                'price' => 12.00,
                'cost_price' => 9.60,
                'profit_amount' => 2.40,
                'status' => 1,
                'provider_status' => 'accept',
                'delivered_codes' => null,
                'delivery_details' => ['message' => 'Topup applied successfully'],
                'provider_payload' => ['status' => 'accept'],
                'refunded_at' => null,
            ]
        );

        Payment::updateOrCreate(
            ['orderId' => 'ORD-CODE-002'],
            [
                'support_id' => 'ORD-DEMO002',
                'user_id' => $user->id,
                'card_id' => $steamProduct->id,
                'destinationProfileId' => '',
                'amount' => 1,
                'price' => 21.50,
                'cost_price' => 19.90,
                'profit_amount' => 1.60,
                'status' => 1,
                'provider_status' => 'accept',
                'delivered_codes' => "CODE-AAA-111\nCODE-BBB-222",
                'delivery_details' => ['replay_api' => ['CODE-AAA-111', 'CODE-BBB-222']],
                'provider_payload' => ['status' => 'accept'],
                'refunded_at' => null,
            ]
        );

        Payment::updateOrCreate(
            ['orderId' => 'ORD-WAIT-003'],
            [
                'support_id' => 'ORD-DEMO003',
                'user_id' => $seller->id,
                'card_id' => $freeFireProduct->id,
                'destinationProfileId' => '99887766',
                'amount' => 110,
                'price' => 4.90,
                'cost_price' => 4.30,
                'profit_amount' => 0.60,
                'status' => 0,
                'provider_status' => 'wait',
                'delivered_codes' => null,
                'delivery_details' => null,
                'provider_payload' => ['status' => 'wait'],
                'refunded_at' => null,
            ]
        );

        Banner::updateOrCreate(
            ['title' => 'أهلاً بك في Sh7nle'],
            [
                'subtitle' => 'بانر تجريبي محلي 1600×600 لعرض شكل الواجهة قبل الرفع على السيرفر.',
                'image' => '/demo/banner/store-banner-1600x600.svg',
                'link' => '/main',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        $sender = User::query()->where('email', 'superadmin@admin.com')->first() ?: User::query()->first();

        Notification::firstOrCreate(
            ['title' => 'إشعار عام تجريبي'],
            [
                'message' => 'مرحبًا بك في Sh7nle. تمت إضافة بيانات ومنتجات وصور محلية حتى تراجع الشكل العام بسهولة.',
                'sender_id' => $sender?->id ?? 1,
                'receiver_id' => null,
            ]
        );
    }
}

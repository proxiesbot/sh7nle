<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodsSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::updateOrCreate(
            ['provider' => 'kazawallet'],
            [
                'name' => 'Kazawallet',
                'account' => env('KAZAWALLET_EMAIL', 'merchant@example.com'),
                'notes' => 'رابط دفع أوتوماتيكي عبر Kazawallet.',
                'status' => true,
                'is_automatic' => true,
                'requires_payment_id' => false,
                'requires_image' => false,
                'available_for_referral_withdrawal' => false,
                'config' => ['provider' => 'kazawallet'],
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'تحويل يدوي'],
            [
                'provider' => 'manual',
                'account' => 'أضف هنا رقم الحساب أو عنوان المحفظة.',
                'notes' => 'مثال لطريقة دفع يدوية قابلة للتخصيص من لوحة التحكم.',
                'status' => true,
                'is_automatic' => false,
                'requires_payment_id' => true,
                'requires_image' => false,
                'available_for_referral_withdrawal' => true,
                'config' => ['provider' => 'manual'],
            ]
        );
    }
}

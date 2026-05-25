<?php

use App\Models\Card;
use App\Models\Section;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sections') || ! Schema::hasTable('cards')) {
            return;
        }

        $section = Section::query()->firstOrCreate(
            ['name' => 'Sh7nle Gift Cards'],
            [
                'description' => 'بطاقات رصيد داخلية يمكن شراؤها وإهداؤها أو استردادها من زر Gift Card.',
                'section_id' => 0,
                'icon' => '/demo/products/sh7nle-gift-card.svg',
                'background' => '/demo/products/sh7nle-gift-card.svg',
            ]
        );

        Card::query()->updateOrCreate(
            ['name' => 'Sh7nle Gift Card'],
            [
                'section_id' => $section->id,
                'description' => 'بطاقة شحن داخلية خاصة بمنصة Sh7nle. اختر الفئة، اشترِ البطاقة، ثم استخدم الكود من زر Gift Card لشحن الرصيد أو أرسله لشخص آخر.',
                'price' => 5,
                'cost_price' => 5,
                'provider_cost_price' => 5,
                'price_adjustment_percentage' => 0,
                'profit_percentage' => 0,
                'minAmount' => 1,
                'maxAmount' => 20,
                'discount' => 0,
                'sawaCardId' => '0',
                'provider_product_id' => null,
                'provider_source_id' => null,
                'icon' => '/demo/products/sh7nle-gift-card.svg',
                'background' => '/demo/products/sh7nle-gift-card.svg',
                'requires_player_id' => false,
                'requires_secondary_player_id' => false,
                'player_id_label' => null,
                'secondary_player_id_label' => null,
                'quantity_label' => 'عدد البطاقات',
                'amount_mode' => 'quantity',
                'delivery_mode' => 'internal_gift_card',
                'provider_product_type' => 'internal_gift_card',
                'provider_qty_values' => [5, 10, 15, 20, 25, 50],
                'provider_params' => [],
                'purchase_flow' => 'codes_quantity',
                'option_prices' => [
                    '5' => 5,
                    '10' => 10,
                    '15' => 15,
                    '20' => 20,
                    '25' => 25,
                    '50' => 50,
                ],
                'option_costs' => [
                    '5' => 5,
                    '10' => 10,
                    '15' => 15,
                    '20' => 20,
                    '25' => 25,
                    '50' => 50,
                ],
                'provider_option_product_ids' => null,
                'is_active' => true,
            ]
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('cards')) {
            return;
        }

        Card::query()->where('name', 'Sh7nle Gift Card')->delete();
    }
};

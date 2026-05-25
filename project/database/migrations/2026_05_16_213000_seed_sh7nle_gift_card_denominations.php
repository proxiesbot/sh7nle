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

        $section = Section::query()->updateOrCreate(
            ['name' => 'Sh7nle Gift Cards'],
            [
                'description' => 'بطاقات رصيد داخلية خاصة بمنصة Sh7nle، يمكن شراؤها وإهداؤها أو استردادها من زر Gift Card.',
                'section_id' => 0,
                'icon' => '/demo/products/sh7nle-gift-card.svg',
                'background' => '/demo/products/sh7nle-gift-card.svg',
            ]
        );

        // Hide the old combined card if it exists, because the store now shows one clear card per denomination.
        Card::query()
            ->where('name', 'Sh7nle Gift Card')
            ->update(['is_active' => false]);

        foreach ([5, 10, 15, 20, 25, 50] as $amount) {
            Card::query()->updateOrCreate(
                ['name' => "Sh7nle Gift Card {$amount}$"],
                [
                    'section_id' => $section->id,
                    'description' => "بطاقة شحنلي بقيمة {$amount}$ تظهر ككود داخل طلباتي، ويمكن استردادها من زر Gift Card أو إرسالها لشخص آخر.",
                    'price' => $amount,
                    'cost_price' => $amount,
                    'provider_cost_price' => $amount,
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
                    'provider_qty_values' => [$amount],
                    'provider_params' => [],
                    'purchase_flow' => 'codes_quantity',
                    'option_prices' => [(string) $amount => $amount],
                    'option_costs' => [(string) $amount => $amount],
                    'provider_option_product_ids' => null,
                    'is_active' => true,
                ]
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('cards')) {
            return;
        }

        Card::query()->whereIn('name', [
            'Sh7nle Gift Card 5$',
            'Sh7nle Gift Card 10$',
            'Sh7nle Gift Card 15$',
            'Sh7nle Gift Card 20$',
            'Sh7nle Gift Card 25$',
            'Sh7nle Gift Card 50$',
        ])->delete();

        Card::query()
            ->where('name', 'Sh7nle Gift Card')
            ->update(['is_active' => true]);
    }
};

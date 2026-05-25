<?php

namespace App\Services;

use App\Http\Controllers\FortuneWheelController;
use App\Http\Controllers\GiftCardController;
use App\Http\Utility\PaymentUtility;
use App\Models\Card;
use App\Models\Deposit;
use App\Models\Payment;
use App\Models\ReferralWithdrawal;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\Providers\ProviderGateway;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Encapsulates the store purchase logic previously in UserController::buyCard.
 * Handles pricing, provider ordering, balance deduction, and order tracking.
 */
class PurchaseService
{
    public function __construct(protected ProviderGateway $providerGateway)
    {
    }

    /**
     * Get the effective unit price for a card considering user discounts and reseller pricing.
     */
    public function getEffectiveUnitPrice(Card $card, User $user, mixed $selectedValue = null): float
    {
        $globalMarkup = (float) Setting::get('pricing.global_markup_percentage', 0);
        $specialDiscountPercentage = (float) $user->special_price_discount_percentage;
        $hasResellerPricing = (bool) $user->api_enabled || (float) $user->reseller_markup_percentage > 0;

        if ($hasResellerPricing) {
            $baseCost = $this->getEffectiveUnitCost($card, $selectedValue);
            $price = $baseCost * (1 + ((float) $user->reseller_markup_percentage / 100));

            return round($price, 2);
        }

        $basePrice = $selectedValue !== null && is_array($card->option_prices) && array_key_exists((string) $selectedValue, $card->option_prices)
            ? (float) $card->option_prices[(string) $selectedValue]
            : (float) $card->price;

        $price = $basePrice * (1 + ($globalMarkup / 100));
        $price = $price * (1 - ($specialDiscountPercentage / 100));

        return round($price, 2);
    }

    /**
     * Get the effective unit cost for a card.
     */
    public function getEffectiveUnitCost(Card $card, mixed $selectedValue = null): float
    {
        if ($selectedValue !== null && is_array($card->option_costs) && array_key_exists((string) $selectedValue, $card->option_costs)) {
            return round((float) $card->option_costs[(string) $selectedValue], 2);
        }

        $providerCost = (float) ($card->cost_price ?: $card->provider_cost_price ?: 0);

        return round($providerCost, 2);
    }

    /**
     * Determine the purchase flow for a card.
     */
    public function getPurchaseFlow(Card $card): string
    {
        if ($card->purchase_flow) {
            return $card->purchase_flow;
        }

        if ($card->requires_secondary_player_id) {
            return 'player_and_server';
        }

        if ($card->amount_mode === 'custom_value') {
            return 'player_custom_value';
        }

        if ($card->requires_player_id) {
            return 'player_category';
        }

        if (is_array($card->provider_qty_values) && array_is_list($card->provider_qty_values) && count($card->provider_qty_values) > 1) {
            return 'codes_quantity';
        }

        return 'direct_purchase';
    }

    /**
     * Check if a card uses mapped provider options.
     */
    public function usesMappedProviderOptions(Card $card): bool
    {
        return is_array($card->provider_option_product_ids) && ! empty($card->provider_option_product_ids);
    }

    /**
     * Resolve the provider product ID for a given card and selected value.
     */
    public function resolveProviderProductId(Card $card, mixed $selectedValue = null): ?string
    {
        if ($this->usesMappedProviderOptions($card) && $selectedValue !== null) {
            $productId = $card->provider_option_product_ids[(string) $selectedValue] ?? null;

            return filled($productId) ? (string) $productId : null;
        }

        if (filled($card->provider_product_id)) {
            return (string) $card->provider_product_id;
        }

        return filled($card->sawaCardId) ? (string) $card->sawaCardId : null;
    }

    /**
     * Calculate referral commission for a purchase.
     */
    public function calculateReferralCommission(User $buyer, float $linePrice): float
    {
        if (! $buyer->referrer) {
            return 0.0;
        }

        return round($linePrice * ((float) $buyer->referrer->referral_rate_percentage / 100), 2);
    }

    /**
     * Generate a unique support ID.
     */
    public function generateSupportId(string $prefix): string
    {
        do {
            $value = $prefix . '-' . Str::upper(Str::random(10));
        } while (
            Payment::query()->where('support_id', $value)->exists() ||
            Deposit::query()->where('support_id', $value)->exists() ||
            ReferralWithdrawal::query()->where('support_id', $value)->exists()
        );

        return $value;
    }

    /**
     * Normalize provider failure message to Arabic user-friendly text.
     */
    public function normalizePurchaseFailureMessage(Throwable $exception): string
    {
        $message = trim((string) $exception->getMessage());
        $haystack = mb_strtolower($message);

        if ($haystack === '' || str_contains($haystack, '404')) {
            return 'المنتج أو الخدمة غير متاحة حاليًا لدى المزود.';
        }

        if (str_contains($haystack, 'insufficient') || str_contains($haystack, 'balance') || str_contains($haystack, 'رصيد')) {
            return 'الرصيد غير كافٍ لإتمام عملية الشراء.';
        }

        if (str_contains($haystack, 'rate limit') || str_contains($haystack, 'too many requests') || str_contains($haystack, '429')) {
            return 'المزود الخارجي مشغول حاليًا بسبب كثرة الطلبات. حاول بعد دقيقة.';
        }

        if (str_contains($haystack, 'timeout') || str_contains($haystack, 'timed out')) {
            return 'انتهت مهلة الاتصال بالمزود الخارجي. حاول مرة أخرى.';
        }

        return 'تعذر تنفيذ الطلب من المزود الخارجي حاليًا. حاول مرة أخرى لاحقًا.';
    }
}

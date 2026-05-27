<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\ImportedProviderProduct;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'globalMarkupPercentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
                'depositUsdToSypRate' => (float) Setting::get('payments.deposit_usd_to_syp_rate', env('CREDIT_PRICE', 1)),
                'minimumDepositUsd' => (float) Setting::get('payments.minimum_deposit_usd', 1),
                'level2Threshold' => (float) Setting::get('levels.level2_threshold', 250),
                'level3Threshold' => (float) Setting::get('levels.level3_threshold', 1000),
                'level4Threshold' => (float) Setting::get('levels.level4_threshold', 2500),
                'level2DiscountPercentage' => (float) Setting::get('levels.level2_discount_percentage', 0),
                'level3DiscountPercentage' => (float) Setting::get('levels.level3_discount_percentage', 0),
                'level4DiscountPercentage' => (float) Setting::get('levels.level4_discount_percentage', 0),
                'bannerAutoplaySeconds' => (int) Setting::get('banners.autoplay_seconds', 5),
                'referralsEnabled' => (bool) Setting::get('features.referrals_enabled', false),
                'socialFacebookUrl' => (string) Setting::get('social.facebook_url', env('SOCIAL_FACEBOOK_URL', '')),
                'socialInstagramUrl' => (string) Setting::get('social.instagram_url', env('SOCIAL_INSTAGRAM_URL', '')),
                'socialTelegramUrl' => (string) Setting::get('social.telegram_url', env('SOCIAL_TELEGRAM_URL', '')),
                'socialWhatsappUrl' => (string) Setting::get('social.whatsapp_url', env('SOCIAL_WHATSAPP_URL', '')),
                'socialSupportUrl' => (string) Setting::get('social.support_url', ''),
                'mailFromAddress' => (string) Setting::get('mail.from_address', env('MAIL_FROM_ADDRESS', '')),
                'mailFromName' => (string) Setting::get('mail.from_name', env('MAIL_FROM_NAME', 'Sh7nle')),
                'mailHost' => (string) Setting::get('mail.host', env('MAIL_HOST', '')),
                'mailPort' => (string) Setting::get('mail.port', env('MAIL_PORT', '587')),
                'mailUsername' => (string) Setting::get('mail.username', env('MAIL_USERNAME', '')),
                'telegramBackupEnabled' => (bool) Setting::get('backup.telegram_enabled', false),
                'telegramBackupBotToken' => (string) Setting::get('backup.telegram_bot_token', env('TELEGRAM_BACKUP_BOT_TOKEN', '')),
                'telegramBackupChatId' => (string) Setting::get('backup.telegram_chat_id', env('TELEGRAM_BACKUP_CHAT_ID', '')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'globalMarkupPercentage' => ['required', 'numeric', 'min:-100', 'max:1000'],
            'depositUsdToSypRate' => ['required', 'numeric', 'min:1'],
            'minimumDepositUsd' => ['required', 'numeric', 'min:0.01'],
            'level2Threshold' => ['required', 'numeric', 'min:0'],
            'level3Threshold' => ['required', 'numeric', 'min:0'],
            'level4Threshold' => ['required', 'numeric', 'min:0'],
            'level2DiscountPercentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'level3DiscountPercentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'level4DiscountPercentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'bannerAutoplaySeconds' => ['required', 'integer', 'min:2', 'max:60'],
            'referralsEnabled' => ['required', 'boolean'],
            'socialFacebookUrl' => ['nullable', 'string', 'max:1000'],
            'socialInstagramUrl' => ['nullable', 'string', 'max:1000'],
            'socialTelegramUrl' => ['nullable', 'string', 'max:1000'],
            'socialWhatsappUrl' => ['nullable', 'string', 'max:1000'],
            'socialSupportUrl' => ['nullable', 'string', 'max:1000'],
            'mailFromAddress' => ['nullable', 'email', 'max:255'],
            'mailFromName' => ['nullable', 'string', 'max:255'],
            'mailHost' => ['nullable', 'string', 'max:255'],
            'mailPort' => ['nullable', 'string', 'max:20'],
            'mailUsername' => ['nullable', 'string', 'max:255'],
            'telegramBackupEnabled' => ['required', 'boolean'],
            'telegramBackupBotToken' => ['nullable', 'string', 'max:255'],
            'telegramBackupChatId' => ['nullable', 'string', 'max:255'],
        ]);

        $previousGlobalMarkup = (float) Setting::get('pricing.global_markup_percentage', 0);

        Setting::set('pricing.global_markup_percentage', $validated['globalMarkupPercentage'], 'float', 'pricing');
        Setting::set('payments.deposit_usd_to_syp_rate', $validated['depositUsdToSypRate'], 'float', 'payments');
        Setting::set('payments.minimum_deposit_usd', $validated['minimumDepositUsd'], 'float', 'payments');
        Setting::set('levels.level2_threshold', $validated['level2Threshold'], 'float', 'levels');
        Setting::set('levels.level3_threshold', $validated['level3Threshold'], 'float', 'levels');
        Setting::set('levels.level4_threshold', $validated['level4Threshold'], 'float', 'levels');
        Setting::set('levels.level2_discount_percentage', $validated['level2DiscountPercentage'], 'float', 'levels');
        Setting::set('levels.level3_discount_percentage', $validated['level3DiscountPercentage'], 'float', 'levels');
        Setting::set('levels.level4_discount_percentage', $validated['level4DiscountPercentage'], 'float', 'levels');
        Setting::set('banners.autoplay_seconds', $validated['bannerAutoplaySeconds'], 'integer', 'banners');
        Setting::set('features.referrals_enabled', $validated['referralsEnabled'], 'boolean', 'features');
        Setting::set('social.facebook_url', $validated['socialFacebookUrl'] ?? '', 'string', 'social');
        Setting::set('social.instagram_url', $validated['socialInstagramUrl'] ?? '', 'string', 'social');
        Setting::set('social.telegram_url', $validated['socialTelegramUrl'] ?? '', 'string', 'social');
        Setting::set('social.whatsapp_url', $validated['socialWhatsappUrl'] ?? '', 'string', 'social');
        Setting::set('social.support_url', $validated['socialSupportUrl'] ?? '', 'string', 'social');
        Setting::set('mail.from_address', $validated['mailFromAddress'] ?? '', 'string', 'mail');
        Setting::set('mail.from_name', $validated['mailFromName'] ?? 'Sh7nle', 'string', 'mail');
        Setting::set('mail.host', $validated['mailHost'] ?? '', 'string', 'mail');
        Setting::set('mail.port', $validated['mailPort'] ?? '587', 'string', 'mail');
        Setting::set('mail.username', $validated['mailUsername'] ?? '', 'string', 'mail');
        Setting::set('backup.telegram_enabled', $validated['telegramBackupEnabled'], 'boolean', 'backup');
        Setting::set('backup.telegram_bot_token', $validated['telegramBackupBotToken'] ?? '', 'string', 'backup');
        Setting::set('backup.telegram_chat_id', $validated['telegramBackupChatId'] ?? '', 'string', 'backup');

        $globalMarkup = (float) $validated['globalMarkupPercentage'];

        Card::query()
            ->where(function ($query) use ($previousGlobalMarkup) {
                $query
                    ->whereNull('profit_percentage')
                    ->orWhere('profit_percentage', 0)
                    ->orWhere('profit_percentage', $previousGlobalMarkup);
            })
            ->chunkById(200, function ($cards) use ($globalMarkup) {
                foreach ($cards as $card) {
                    $baseCost = (float) ($card->provider_cost_price ?? $card->cost_price ?? 0);

                    if ($baseCost > 0) {
                        $card->price = round($baseCost * (1 + ($globalMarkup / 100)), 6);
                    }

                    $card->profit_percentage = $globalMarkup;
                    $card->price_adjustment_percentage = $globalMarkup;
                    $card->save();
                }
            });

        ImportedProviderProduct::query()
            ->where(function ($query) use ($previousGlobalMarkup) {
                $query
                    ->whereNull('profit_percentage')
                    ->orWhere('profit_percentage', 0)
                    ->orWhere('profit_percentage', $previousGlobalMarkup);
            })
            ->chunkById(200, function ($products) use ($globalMarkup) {
                foreach ($products as $product) {
                    $baseCost = (float) ($product->provider_cost_price ?? $product->cost_price ?? 0);

                    if ($baseCost > 0) {
                        $product->price = round($baseCost * (1 + ($globalMarkup / 100)), 6);
                    }

                    $product->profit_percentage = $globalMarkup;
                    $product->save();
                }
            });

        return back()->with('success', 'تم تحديث إعدادات المتجر بنجاح، وتم تطبيق نسبة الربح العامة على كل المنتجات غير المخصصة مع تحديث أسعارها.');
    }
}

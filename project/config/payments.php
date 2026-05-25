<?php

/**
 * Payment & Provider Configuration
 *
 * All payment-related environment values should be accessed via config('payments.xxx')
 * instead of env() directly — so that config:cache works correctly on Hostinger.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Credit Price (USD to SYP rate fallback)
    |--------------------------------------------------------------------------
    */
    'credit_price' => (float) env('CREDIT_PRICE', 1),

    /*
    |--------------------------------------------------------------------------
    | Kazawallet
    |--------------------------------------------------------------------------
    */
    'kazawallet' => [
        'api_key' => env('KAZAWALLET_API_KEY'),
        'secret' => env('KAZAWALLET_SECRET'),
        'email' => env('KAZAWALLET_EMAIL'),
        'ref_token' => env('KAZAWALLET_REF_TOKEN', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Syria
    |--------------------------------------------------------------------------
    */
    'apisyria' => [
        'api_key' => env('API_SYRIA_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Display
    |--------------------------------------------------------------------------
    */
    'display_name' => env('DISPLAY_NAME', 'Sh7nle'),

    /*
    |--------------------------------------------------------------------------
    | Social Links (fallbacks for settings)
    |--------------------------------------------------------------------------
    */
    'social' => [
        'whatsapp_url' => env('SOCIAL_WHATSAPP_URL'),
        'instagram_url' => env('SOCIAL_INSTAGRAM_URL'),
        'telegram_url' => env('SOCIAL_TELEGRAM_URL'),
        'facebook_url' => env('SOCIAL_FACEBOOK_URL'),
    ],

];

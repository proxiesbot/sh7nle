<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'type', 'group'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return static::castStoredValue($setting->type, $setting->getRawOriginal('value'), $default);
    }

    public static function set(string $key, mixed $value, string $type = 'string', string $group = 'general'): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            [
                'value' => static::prepareStoredValue($type, $value),
                'type' => $type,
                'group' => $group,
            ]
        );
    }

    public static function publicSettings(): array
    {
        return [
            'features' => [
                'referralsEnabled' => (bool) static::get('features.referrals_enabled', false),
            ],
            'pricing' => [
                'globalMarkupPercentage' => (float) static::get('pricing.global_markup_percentage', 0),
                'depositUsdToSypRate' => (float) static::get('payments.deposit_usd_to_syp_rate', env('CREDIT_PRICE', 1)),
                'minimumDepositUsd' => (float) static::get('payments.minimum_deposit_usd', 1),
            ],
            'banners' => [
                'autoplaySeconds' => max(2, (int) static::get('banners.autoplay_seconds', 5)),
            ],
            'levels' => [
                'level2Threshold' => (float) static::get('levels.level2_threshold', 250),
                'level3Threshold' => (float) static::get('levels.level3_threshold', 1000),
                'level4Threshold' => (float) static::get('levels.level4_threshold', 2500),
                'level2DiscountPercentage' => (float) static::get('levels.level2_discount_percentage', 0),
                'level3DiscountPercentage' => (float) static::get('levels.level3_discount_percentage', 0),
                'level4DiscountPercentage' => (float) static::get('levels.level4_discount_percentage', 0),
            ],
        ];
    }

    protected static function castStoredValue(string $type, mixed $value, mixed $default = null): mixed
    {
        if ($value === null) {
            return $default;
        }

        return match ($type) {
            'integer' => (int) $value,
            'float', 'decimal' => (float) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode((string) $value, true) ?: $default,
            default => (string) $value,
        };
    }

    protected static function prepareStoredValue(string $type, mixed $value): mixed
    {
        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };
    }
}

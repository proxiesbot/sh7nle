<?php

namespace App\Http\Middleware;

use App\Models\Banner;
use App\Models\ContentText;
use App\Models\Payment;
use App\Models\Deposit;
use App\Models\Section;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        if ($request->user() && !$isAuthPage && \Illuminate\Support\Facades\Schema::hasColumn('users', 'last_seen_at')) {
            $lastSeen = $request->user()->last_seen_at;
            if (! $lastSeen || now()->diffInSeconds($lastSeen) > 60) {
                $request->user()->forceFill(['last_seen_at' => now()])->saveQuietly();
            }
        }

        $path = trim((string) $request->path(), '/');
        $isAuthPage = in_array($path, ['login', 'register', 'forgot-password'], true)
            || str_starts_with($path, 'reset-password')
            || str_starts_with($path, 'two-factor-challenge');

        $shared = array_merge(parent::share($request), [
            'appName' => config('app.name', 'Sh7nle'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'warning' => fn () => $request->session()->get('warning'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'storeSections' => fn () => $isAuthPage ? collect() : (Schema::hasTable('sections')
                ? Section::query()
                    ->where('section_id', 0)
                    ->orderBy('name')
                    ->get(['id', 'name', 'icon'])
                : collect()),
            'activeBanner' => fn () => $isAuthPage ? null : (Schema::hasTable('banners')
                ? Banner::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->latest()
                    ->first()
                : null),
            'activeBanners' => fn () => $isAuthPage ? collect() : (Schema::hasTable('banners')
                ? Banner::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
                : collect()),
            'siteSettings' => fn () => $isAuthPage ? [] : Setting::publicSettings(),
            'contentTexts' => fn () => $isAuthPage ? collect() : (Schema::hasTable('content_texts')
                ? ContentText::query()->pluck('text', 'key')
                : collect()),
            'socialLinks' => fn () => $isAuthPage ? [] : [
                'whatsapp' => Setting::get('social.whatsapp_url', env('SOCIAL_WHATSAPP_URL')),
                'instagram' => Setting::get('social.instagram_url', env('SOCIAL_INSTAGRAM_URL')),
                'telegram' => Setting::get('social.telegram_url', env('SOCIAL_TELEGRAM_URL')),
                'facebook' => Setting::get('social.facebook_url', env('SOCIAL_FACEBOOK_URL')),
                'support' => Setting::get('social.support_url', ''),
            ],
            'adminCounters' => fn () => $isAuthPage ? [] : [
                'pendingDeposits' => Schema::hasTable('deposits') ? Deposit::query()->where('status', 0)->count() : 0,
                'pendingOrders' => Schema::hasTable('payments') ? Payment::query()->whereIn('status', [0, 2])->count() : 0,
            ],
        ]);

        if ($request->user()) {
            $request->user()->loadMissing('roles');
            $request->user()->loadCount('unseenNotifications');

            $roleNames = $request->user()->roles->pluck('name')->filter()->values();
            $normalizedRoles = $roleNames->map(fn ($role) => str_replace(['-', '_', ' '], '', mb_strtolower($role)));
            $email = mb_strtolower((string) $request->user()->email);
            $isSuperAdmin = $normalizedRoles->contains('superadmin')
                || $normalizedRoles->contains('superadministrator')
                || str_contains($email, 'superadmin');
            $isAdmin = $isSuperAdmin
                || $normalizedRoles->contains('admin')
                || $normalizedRoles->contains('administrator')
                || str_contains($email, 'admin');

            $shared = array_merge($shared, [
                'auth.user.role' => ($request->user() && count($request->user()->roles) > 0) ? Auth::user()->roles[0] : null,
                'auth.user.roles' => $request->user()->roles,
                'auth.user.role_names' => $roleNames,
                'auth.user.referral_code' => $request->user()->referral_code,
                'auth.user.referral_balance' => $request->user()->referral_balance,
                'auth.user.total_referral_earnings' => $request->user()->total_referral_earnings,
                'auth.user.special_price_discount_percentage' => $request->user()->special_price_discount_percentage,
                'auth.user.is_blocked' => $request->user()->is_blocked,
                'auth.user.customer_level' => $request->user()->customer_level,
                'auth.user.api_enabled' => $request->user()->api_enabled,
                'auth.user.api_token_preview' => $request->user()->api_token ? substr($request->user()->api_token, 0, 12) . '…' : null,
                'isSuperAdmin' => $isSuperAdmin,
                'isAdmin' => $isAdmin,
                'creditPrice' => env('CREDIT_PRICE', 1),
            ]);
        }

        return $shared;
    }
}

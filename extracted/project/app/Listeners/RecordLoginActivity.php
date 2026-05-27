<?php

namespace App\Listeners;

use App\Models\LoginActivity;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RecordLoginActivity
{
    /**
     * Cache schema checks to avoid repeated DB queries on each login.
     */
    protected static ?bool $tableExists = null;
    protected static ?bool $lastSeenColumn = null;
    protected static ?bool $securityColumn = null;

    public function handle(Login $event): void
    {
        if (! $event->user) {
            return;
        }

        // Cache the schema check so we don't hit information_schema every login
        if (self::$tableExists === null) {
            self::$tableExists = Schema::hasTable('login_activities');
        }

        if (! self::$tableExists) {
            return;
        }

        $request = request();
        $userAgent = (string) $request->userAgent();
        $ip = (string) $request->ip();

        $isNewDevice = ! LoginActivity::query()
            ->where('user_id', $event->user->id)
            ->where('user_agent', $userAgent)
            ->where('ip_address', $ip)
            ->exists();

        LoginActivity::create([
            'user_id' => $event->user->id,
            'event' => 'login',
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'browser' => $this->browser($userAgent),
            'platform' => $this->platform($userAgent),
            'device_type' => $this->deviceType($userAgent),
            'is_new_device' => $isNewDevice,
        ]);

        // Update last_seen_at (cached column check)
        if (self::$lastSeenColumn === null) {
            self::$lastSeenColumn = Schema::hasColumn('users', 'last_seen_at');
        }
        if (self::$lastSeenColumn) {
            $event->user->forceFill(['last_seen_at' => now()])->saveQuietly();
        }

        // Send security email only for new devices - non-blocking (try/catch with minimal work)
        if ($isNewDevice && $event->user->email) {
            if (self::$securityColumn === null) {
                self::$securityColumn = Schema::hasColumn('users', 'last_security_confirmation_sent_at');
            }

            if (self::$securityColumn) {
                $lastSent = $event->user->last_security_confirmation_sent_at;
                if (! $lastSent || now()->diffInMinutes($lastSent) > 30) {
                    $event->user->forceFill(['last_security_confirmation_sent_at' => now()])->saveQuietly();
                    try {
                        Mail::raw(
                            "تم تسجيل دخول جديد إلى حسابك في Sh7nle.\n\nIP: {$ip}\nDevice: " . $this->deviceType($userAgent) . "\nBrowser: " . $this->browser($userAgent) . "\n\nإذا لم تكن أنت، غيّر كلمة المرور فورًا.",
                            function ($message) use ($event) {
                                $message->to($event->user->email)->subject('تنبيه أمان: تسجيل دخول جديد إلى حساب Sh7nle');
                            }
                        );
                    } catch (Throwable $exception) {
                        // Don't block login if mail fails
                        report($exception);
                    }
                }
            }
        }
    }

    protected function browser(string $ua): string
    {
        return str_contains($ua, 'Edg') ? 'Edge'
            : (str_contains($ua, 'Chrome') ? 'Chrome'
            : (str_contains($ua, 'Firefox') ? 'Firefox'
            : (str_contains($ua, 'Safari') ? 'Safari' : 'Unknown')));
    }

    protected function platform(string $ua): string
    {
        return str_contains($ua, 'Android') ? 'Android'
            : (str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') ? 'iOS'
            : (str_contains($ua, 'Windows') ? 'Windows'
            : (str_contains($ua, 'Mac') ? 'macOS'
            : (str_contains($ua, 'Linux') ? 'Linux' : 'Unknown'))));
    }

    protected function deviceType(string $ua): string
    {
        return str_contains($ua, 'Mobile') || str_contains($ua, 'Android') || str_contains($ua, 'iPhone') ? 'Mobile' : 'Desktop';
    }
}

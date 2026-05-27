<?php

namespace App\Listeners;

use App\Models\LoginActivity;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RecordLoginActivity
{
    public function handle(Login $event): void
    {
        if (! Schema::hasTable('login_activities') || ! $event->user) {
            return;
        }

        $request = request();
        $userAgent = (string) $request->userAgent();
        $ip = (string) $request->ip();
        $fingerprint = substr(sha1($userAgent.'|'.$ip), 0, 16);

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

        if (Schema::hasColumn('users', 'last_seen_at')) {
            $event->user->forceFill(['last_seen_at' => now()])->saveQuietly();
        }

        if ($isNewDevice && $event->user->email && Schema::hasColumn('users', 'last_security_confirmation_sent_at')) {
            $lastSent = $event->user->last_security_confirmation_sent_at;
            if (! $lastSent || now()->diffInMinutes($lastSent) > 30) {
                $event->user->forceFill(['last_security_confirmation_sent_at' => now()])->saveQuietly();
                try {
                    Mail::raw("تم تسجيل دخول جديد إلى حسابك في Sh7nle.\n\nIP: {$ip}\nDevice: ".$this->deviceType($userAgent)."\nBrowser: ".$this->browser($userAgent)."\n\nإذا لم تكن أنت، غيّر كلمة المرور فورًا.", function ($message) use ($event) {
                        $message->to($event->user->email)->subject('تنبيه أمان: تسجيل دخول جديد إلى حساب Sh7nle');
                    });
                } catch (Throwable $exception) {
                    report($exception);
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

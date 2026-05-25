<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            if (! $googleUser->getEmail()) {
                return redirect()->route('login')->withErrors([
                    'google' => 'تعذر الحصول على البريد الإلكتروني من Google. تأكد من منح صلاحية البريد.',
                ]);
            }

            $user = User::query()
                ->where('google_id', $googleUser->getId())
                ->orWhere(function ($query) use ($googleUser) {
                    if ($googleUser->getEmail()) {
                        $query->where('email', $googleUser->getEmail());
                    }
                })
                ->first();

            $isNewUser = false;

            if (! $user) {
                $user = User::create([
                    'name' => $googleUser->getName() ?: 'Google User',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('Normal');
                $isNewUser = true;
            } elseif (! $user->google_id) {
                $user->google_id = $googleUser->getId();
                if (! $user->email_verified_at && $googleUser->getEmail()) {
                    $user->email_verified_at = now();
                }
                $user->save();
            }

            Auth::login($user);

            if ($isNewUser || ! $user->two_factor_secret) {
                session()->flash('show_2fa_prompt', true);
            }

            if ($isNewUser) {
                session()->flash('is_new_user', true);
            }

            return redirect()->intended(route('sections.main'));
        } catch (\Throwable $error) {
            Log::error('Google authentication failed.', [
                'message' => $error->getMessage(),
            ]);

            return redirect()->route('login')->withErrors([
                'google' => 'تعذر تسجيل الدخول باستخدام Google في الوقت الحالي. حاول مرة أخرى لاحقًا.',
            ]);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\GiftCard;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GiftCardController extends Controller
{
    public function redeemPage(): Response
    {
        return Inertia::render('GiftCard/Redeem');
    }

    public function redeem(Request $request): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required','string','max:80']]);
        $code = strtoupper(trim($validated['code']));

        try {
            DB::transaction(function () use ($request, $code) {
                $card = GiftCard::query()->lockForUpdate()->where('code', $code)->firstOrFail();

                if ($card->status !== 'active') {
                    throw new \RuntimeException('هذه البطاقة مستخدمة أو غير فعالة.');
                }

                $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
                $before = (float) $user->balance;
                $amount = (float) $card->amount;
                $user->balance = round($before + $amount, 8);
                $user->save();

                $card->update([
                    'status' => 'redeemed',
                    'redeemed_by' => $user->id,
                    'redeemed_at' => now(),
                ]);

                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'gift_card_redeem',
                    'direction' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $before,
                    'balance_after' => $user->balance,
                    'description' => 'شحن باستخدام غيفت كارد شحنلي',
                    'reference_type' => GiftCard::class,
                    'reference_id' => $card->id,
                    'meta' => [
                        'source' => 'gift_card_redeem',
                        'gift_card_code' => $card->code,
                        'exclude_from_wheel' => true,
                    ],
                ]);
            });
        } catch (\Throwable $e) {
            return back()->withErrors(['code' => $e instanceof \RuntimeException ? $e->getMessage() : 'الكود غير صحيح أو غير متاح.']);
        }

        return back()->with('success', 'تم شحن الرصيد بواسطة الغيفت كارد بنجاح.');
    }

    public static function generate(float $amount, ?int $buyerId = null, string $source = 'purchase'): GiftCard
    {
        do {
            $code = 'SH7-' . Str::upper(Str::random(4)) . '-' . Str::upper(Str::random(4)) . '-' . Str::upper(Str::random(4));
        } while (GiftCard::query()->where('code', $code)->exists());

        return GiftCard::create([
            'code' => $code,
            'amount' => $amount,
            'buyer_id' => $buyerId,
            'source' => $source,
        ]);
    }
}

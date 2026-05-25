<?php

namespace App\Http\Controllers;

use App\Http\Requests\RedeemCodeRequest;
use App\Models\Notification;
use App\Models\RedeemCode;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RedeemCodeController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('RedeemCode');
    }

    public function redeem(RedeemCodeRequest $request): RedirectResponse
    {
        $codeValue = strtoupper(trim($request->validated('code')));
        $user = $request->user();

        try {
            $creditedAmount = DB::transaction(function () use ($codeValue, $user) {
                $redeemCode = RedeemCode::query()
                    ->whereRaw('UPPER(code) = ?', [$codeValue])
                    ->lockForUpdate()
                    ->first();

                if (! $redeemCode) {
                    throw new \RuntimeException('كود غير صحيح. الرجاء التحقق من الكود والمحاولة مرة أخرى.');
                }

                if ($redeemCode->used_at !== null) {
                    throw new \RuntimeException('هذا الكود مستخدم بالفعل.');
                }

                $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
                $lockedUser->balance = round((float) $lockedUser->balance + (float) $redeemCode->amount, 2);
                $lockedUser->save();

                $redeemCode->used_at = now();
                $redeemCode->used_by = $lockedUser->id;
                $redeemCode->save();

                Notification::create([
                    'message' => "تم شحن {$redeemCode->amount} نقطة إلى رصيدك باستخدام كود تعبئة.",
                    'sender_id' => 1,
                    'receiver_id' => $lockedUser->id,
                ]);

                return (float) $redeemCode->amount;
            });
        } catch (\RuntimeException $exception) {
            return back()->withErrors([
                'code' => $exception->getMessage(),
            ]);
        }

        return back()->with('success', 'تم شحن الرصيد بنجاح بقيمة ' . $creditedAmount . ' نقطة.');
    }
}

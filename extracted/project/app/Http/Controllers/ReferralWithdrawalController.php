<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\PaymentMethod;
use App\Models\ReferralWithdrawal;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReferralWithdrawalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ReferralWithdrawal/IndexAdmin', [
            'withdrawals' => ReferralWithdrawal::query()->with('user', 'paymentMethod')->latest()->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'paymentMethodId' => ['required', 'integer', 'exists:payment_methods,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'accountDetails' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $paymentMethod = PaymentMethod::query()->findOrFail($validated['paymentMethodId']);
        abort_unless($paymentMethod->available_for_referral_withdrawal, 422, 'طريقة السحب غير متاحة لأرباح الإحالة.');

        if ((float) $user->referral_balance < (float) $validated['amount']) {
            return back()->withErrors(['amount' => 'رصيد الإحالة الحالي لا يكفي لإنشاء طلب السحب.']);
        }

        DB::transaction(function () use ($validated, $user) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            if ((float) $lockedUser->referral_balance < (float) $validated['amount']) {
                throw new \RuntimeException('رصيد الإحالة الحالي لا يكفي.');
            }

            $lockedUser->referral_balance = round((float) $lockedUser->referral_balance - (float) $validated['amount'], 2);
            $lockedUser->save();

            ReferralWithdrawal::query()->create([
                'support_id' => 'RW-' . Str::upper(Str::random(10)),
                'user_id' => $lockedUser->id,
                'payment_method_id' => $validated['paymentMethodId'],
                'amount' => round((float) $validated['amount'], 2),
                'account_details' => $validated['accountDetails'],
                'notes' => $validated['notes'] ?? null,
                'status' => 0,
            ]);
        });

        return back()->with('success', 'تم إنشاء طلب سحب أرباح الإحالة بنجاح.');
    }

    public function updateStatus(Request $request, ReferralWithdrawal $referralWithdrawal): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'integer', 'in:1,2,3'],
        ]);

        DB::transaction(function () use ($validated, $referralWithdrawal) {
            $withdrawal = ReferralWithdrawal::query()->lockForUpdate()->findOrFail($referralWithdrawal->id);
            $previousStatus = (int) $withdrawal->status;
            $newStatus = (int) $validated['status'];

            if ($previousStatus === 0 && $newStatus === 2) {
                $user = User::query()->lockForUpdate()->findOrFail($withdrawal->user_id);
                $user->referral_balance = round((float) $user->referral_balance + (float) $withdrawal->amount, 2);
                $user->save();
            }

            $withdrawal->status = $newStatus;
            $withdrawal->save();

            Notification::create([
                'title' => 'طلب سحب أرباح الإحالة',
                'message' => "تم تحديث حالة طلب السحب {$withdrawal->support_id} إلى {$this->statusLabel($newStatus)}.",
                'sender_id' => optional(auth()->user())->id,
                'receiver_id' => $withdrawal->user_id,
            ]);
        });

        return back()->with('success', 'تم تحديث حالة طلب السحب.');
    }

    protected function statusLabel(int $status): string
    {
        return match ($status) {
            1 => 'مقبول',
            2 => 'مرفوض',
            3 => 'مدفوع',
            default => 'قيد المراجعة',
        };
    }
}

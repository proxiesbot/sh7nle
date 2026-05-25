<?php

namespace App\Http\Controllers;

use App\Models\GiftCard;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Models\WheelPrize;
use App\Models\WheelSpin;
use App\Models\WheelSpinLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class FortuneWheelController extends Controller
{
    public function index(Request $request): Response
    {
        $activeSpins = $this->activeSpinCount($request->user());

        return Inertia::render('Wheel/Index', [
            'spins' => $activeSpins,
            'expiresAt' => Schema::hasTable('wheel_spins')
                ? optional($request->user()->wheelSpins()->active()->oldest('expires_at')->first()?->expires_at)->toDateTimeString()
                : null,
            'prizes' => $this->activePrizesForDisplay(),
            'howToEarn' => [
                'إيداع واحد بقيمة 10$ أو أكثر يمنحك لفة جديدة.',
                '3 إحالات مؤهلة تمنحك لفة إضافية.',
                'يمكنك استخدام اللفات المتاحة من صفحة العجلة مباشرة.',
            ],
        ]);
    }

    public function admin(Request $request): Response
    {
        $users = Schema::hasTable('users')
            ? User::query()
                ->withCount(['wheelSpins as active_wheel_spins_count' => fn ($query) => $query->active()])
                ->orderByDesc('active_wheel_spins_count')
                ->orderBy('name')
                ->take(500)
                ->get(['id', 'name', 'email', 'balance'])
            : collect();

        $usersWithSpins = $users->filter(fn ($user) => (int) $user->active_wheel_spins_count > 0)->values();

        $logs = Schema::hasTable('wheel_spin_logs')
            ? WheelSpinLog::query()->with('user')->latest()->paginate(30)
            : null;

        return Inertia::render('Wheel/Admin', [
            'users' => $users,
            'usersWithSpins' => $usersWithSpins,
            'logs' => $logs,
            'stats' => [
                'activeSpins' => Schema::hasTable('wheel_spins') ? WheelSpin::active()->count() : 0,
                'usersWithSpins' => $usersWithSpins->count(),
                'spinsToday' => Schema::hasTable('wheel_spin_logs') ? WheelSpinLog::query()->whereDate('created_at', today())->where('action', 'spin')->count() : 0,
            ],
        ]);
    }

    public function grantSpins(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:100'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        for ($i = 0; $i < (int) $validated['amount']; $i++) {
            $this->grantSpin($user, 'admin', $validated['reason'] ?? 'منحة من الإدارة', $request->user()?->id);
        }

        return back()->with('success', 'تم تعديل رصيد العجلة للمستخدم.');
    }

    public function removeSpins(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        if (Schema::hasTable('wheel_spins')) {
            $spins = $user->wheelSpins()->active()->oldest('expires_at')->take((int) $validated['amount'])->get();
            foreach ($spins as $spin) {
                $spin->update(['status' => 'cancelled']);
            }
        }

        return back()->with('success', 'تم حذف اللفات المحددة من المستخدم.');
    }

    public function setSpins(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:0', 'max:100'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $target = (int) $validated['amount'];
        $current = Schema::hasTable('wheel_spins') ? $user->wheelSpins()->active()->count() : 0;

        if ($target > $current) {
            for ($i = 0; $i < ($target - $current); $i++) {
                $this->grantSpin($user, 'admin_set', $validated['reason'] ?? 'تعديل رصيد العجلة من الإدارة', $request->user()?->id);
            }
        }

        if ($target < $current && Schema::hasTable('wheel_spins')) {
            $spins = $user->wheelSpins()->active()->oldest('expires_at')->take($current - $target)->get();
            foreach ($spins as $spin) {
                $spin->update(['status' => 'cancelled']);
            }

            if (Schema::hasTable('wheel_spin_logs')) {
                WheelSpinLog::create([
                    'user_id' => $user->id,
                    'action' => 'set',
                    'message' => $validated['reason'] ?? 'تم تعديل رصيد لفات العجلة من الإدارة.',
                    'meta' => [
                        'from' => $current,
                        'to' => $target,
                        'admin_id' => $request->user()?->id,
                    ],
                ]);
            }
        }

        return back()->with('success', 'تم ضبط رصيد لفات العجلة للمستخدم.');
    }

    public function spin(Request $request): JsonResponse
    {
        if (! Schema::hasTable('wheel_prizes') || ! Schema::hasTable('wheel_spins')) {
            return response()->json(['message' => 'العجلة غير جاهزة بعد. شغّل migrations أولًا.'], 422);
        }

        try {
            $result = DB::transaction(function () use ($request) {
                $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
                $spin = $user->wheelSpins()->active()->lockForUpdate()->oldest('expires_at')->first();

                if (! $spin) {
                    throw new \RuntimeException('لا يوجد لديك لفات متاحة الآن أو انتهت صلاحيتها.');
                }

                $prizes = WheelPrize::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get();

                if ($prizes->isEmpty()) {
                    throw new \RuntimeException('لا توجد جوائز مفعلة الآن.');
                }

                $rollablePrizes = $prizes->filter(fn ($prize) => (int) $prize->weight > 0)->values();
                $totalWeight = max(1, $rollablePrizes->sum('weight'));
                $roll = random_int(1, $totalWeight);
                $cursor = 0;
                $prize = $rollablePrizes->first();

                foreach ($rollablePrizes as $candidate) {
                    $cursor += (int) $candidate->weight;
                    if ($roll <= $cursor) {
                        $prize = $candidate;
                        break;
                    }
                }

                $spin->update([
                    'status' => 'consumed',
                    'consumed_at' => now(),
                ]);

                $message = $this->applyPrize($user, $prize);

                WheelSpinLog::create([
                    'user_id' => $user->id,
                    'wheel_spin_id' => $spin->id,
                    'wheel_prize_id' => $prize->id,
                    'action' => 'spin',
                    'prize_name' => $prize->name,
                    'prize_type' => $prize->type,
                    'prize_value' => $prize->value,
                    'message' => $message,
                    'meta' => [
                        'roll' => $roll,
                        'total_weight' => $totalWeight,
                    ],
                ]);

                return [
                    'prize' => $prize,
                    'message' => $message,
                    'spins' => $this->activeSpinCount($user),
                ];
            });
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($result);
    }

    protected function applyPrize(User $user, WheelPrize $prize): string
    {
        if ($prize->type === 'balance') {
            $before = (float) $user->balance;
            $user->balance = round($before + (float) $prize->value, 8);
            $user->save();

            if (Schema::hasTable('wallet_transactions')) {
                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'wheel',
                    'direction' => 'credit',
                    'amount' => $prize->value,
                    'balance_before' => $before,
                    'balance_after' => $user->balance,
                    'description' => 'جائزة عجلة الفرصة: ' . $this->displayPrizeName($prize),
                    'reference_type' => WheelPrize::class,
                    'reference_id' => $prize->id,
                ]);
            }

            return 'ربحت رصيد ' . $this->formatCurrency($prize->value) . ' وتمت إضافته تلقائيًا.';
        }

        if ($prize->type === 'gift_card' && Schema::hasTable('gift_cards')) {
            $gift = GiftCard::create([
                'code' => 'WHEEL-' . strtoupper(str()->random(4)) . '-' . strtoupper(str()->random(4)),
                'amount' => $prize->value,
                'buyer_id' => $user->id,
                'source' => 'wheel',
            ]);

            return 'ربحت Gift Card بقيمة ' . $this->formatCurrency($prize->value) . ': ' . $gift->code;
        }

        if ($prize->type === 'discount_percent') {
            $discount = $this->formatNumber($prize->value);
            $minimum = (float) ($prize->min_order_amount ?? 0);

            if ($minimum > 0) {
                return 'ربحت خصم ' . $discount . '% على عملية شراء بقيمة ' . $this->formatCurrency($minimum) . ' وما فوق.';
            }

            return 'ربحت خصم ' . $discount . '% على عملية شراء قادمة.';
        }

        if ($prize->type === 'grand_locked') {
            return 'حظ أوفر في المرة القادمة.';
        }

        return 'حظ أوفر في المرة القادمة.';
    }

    protected function formatNumber(mixed $value, int $decimals = 2): string
    {
        $formatted = number_format((float) $value, $decimals, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }

    protected function formatCurrency(mixed $value): string
    {
        return $this->formatNumber($value) . '$';
    }

    protected function displayPrizeName(WheelPrize $prize): string
    {
        if ($prize->type === 'balance') {
            return $this->formatCurrency($prize->value) . ' رصيد';
        }

        if ($prize->type === 'discount_percent') {
            return 'خصم ' . $this->formatNumber($prize->value) . '%';
        }

        if ($prize->type === 'gift_card') {
            return 'Gift Card ' . $this->formatCurrency($prize->value);
        }

        return (string) $prize->name;
    }

    public static function grantSpin(User $user, string $source = 'manual', ?string $reason = null, ?int $adminId = null): ?WheelSpin
    {
        if (! Schema::hasTable('wheel_spins')) {
            return null;
        }

        $spin = WheelSpin::create([
            'user_id' => $user->id,
            'source' => $source,
            'status' => 'active',
            'expires_at' => now()->addHours(24),
            'created_by_admin_id' => $adminId,
            'meta' => ['reason' => $reason],
        ]);

        if (Schema::hasTable('wheel_spin_logs')) {
            WheelSpinLog::create([
                'user_id' => $user->id,
                'wheel_spin_id' => $spin->id,
                'action' => 'grant',
                'message' => $reason ?: 'تم منح ضربة عجلة.',
                'meta' => ['source' => $source],
            ]);
        }

        return $spin;
    }

    protected function activeSpinCount(User $user): int
    {
        return Schema::hasTable('wheel_spins')
            ? $user->wheelSpins()->active()->count()
            : (int) ($user->wheel_spins ?? 0);
    }

    protected function activePrizesForDisplay()
    {
        return Schema::hasTable('wheel_prizes')
            ? WheelPrize::query()->where('is_active', true)->orderBy('id')->get()
            : collect();
    }
}

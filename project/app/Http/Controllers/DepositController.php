<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreatePaymentLinkRequest;
use App\Http\Requests\StoreDepositRequest;
use App\Http\Requests\UpdateDepositStatusRequest;
use App\Models\Deposit;
use App\Models\Notification;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\Payments\ApiSyriaGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Controllers\FortuneWheelController;

class DepositController extends Controller
{
    public function __construct(protected ApiSyriaGateway $apiSyriaGateway)
    {
    }
    public function index(): Response
    {
        return Inertia::render('Deposit/IndexAdmin', [
            'deposits' => Deposit::with('user', 'paymentMethod')->latest()->paginate(10),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Deposit/Create', [
            'paymentMethods' => PaymentMethod::query()->where('status', true)->latest()->get(),
            'usdRate' => (float) Setting::get('payments.deposit_usd_to_syp_rate', config('payments.credit_price', 1)),
            'minimumDepositUsd' => (float) Setting::get('payments.minimum_deposit_usd', 1),
        ]);
    }

    public function store(StoreDepositRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $paymentMethod = PaymentMethod::query()->findOrFail($validated['paymentMethodId']);
        $paymentId = trim((string) ($validated['paymentId'] ?? ''));

        if ($paymentId !== '' && Deposit::query()->where('paymentId', $paymentId)->exists()) {
            return back()->withErrors([
                'paymentId' => 'رقم العملية هذا مستخدم مسبقًا لهذه الوسيلة، ولا يمكن تكرار الشحن بنفس الرقم.',
            ]);
        }

        if ($paymentMethod->is_automatic && in_array($paymentMethod->provider, ['apisyria_syriatel', 'apisyria_shamcash'], true)) {
            return $this->storeAutomaticApiSyriaDeposit($request, $paymentMethod, $validated);
        }

        if ($paymentMethod->is_automatic && ! $paymentMethod->allow_manual_fallback) {
            return back()->withErrors([
                'paymentMethodId' => 'هذه الوسيلة أوتوماتيكية فقط. استخدم زر إنشاء رابط الدفع أو التحقق الآلي الخاص بها.',
            ]);
        }

        $image = $request->file('paymentImage');

        Deposit::create([
            'support_id' => 'DEP-' . Str::upper(Str::random(10)),
            'user_id' => Auth::id(),
            'amount' => round((float) $validated['amount'], 2),
            'paymentId' => $paymentId !== '' ? $paymentId : ('manual:' . Str::uuid()),
            'payment_method_id' => (int) $validated['paymentMethodId'],
            'notes' => ($paymentMethod->is_automatic ? '[manual-fallback] ' : '') . ($validated['notes'] ?? ''),
            'image' => $image ? Storage::url($image->storePublicly('images/deposits')) : null,
        ]);

        return redirect()->route('user.deposits', Auth::user())->with('success', 'تم إرسال طلب الإيداع بنجاح.');
    }

    public function show(Deposit $deposit)
    {
        //
    }

    public function edit(Deposit $deposit)
    {
        //
    }

    public function update(Request $request, Deposit $deposit)
    {
        //
    }

    public function destroy(Deposit $deposit)
    {
        //
    }

    public function createPaymentLink(CreatePaymentLinkRequest $request): JsonResponse
    {
        $paymentMethod = PaymentMethod::query()->findOrFail($request->validated('paymentMethodId'));

        if (! $paymentMethod->is_automatic || $paymentMethod->provider !== 'kazawallet') {
            return response()->json([
                'message' => 'طريقة الدفع المختارة ليست أوتوماتيكية عبر Kazawallet.',
            ], 422);
        }

        $amount = (float) $request->validated('amount');
        $currency = $request->validated('currency');

        if ($currency === 'SYP') {
            $amount *= (float) config('payments.credit_price', 1);
        }

        $response = Http::withHeaders([
            'x-api-key' => config('payments.kazawallet.api_key'),
            'Content-Type' => 'application/json',
        ])->post('https://outdoor.kasroad.com/wallet/createPaymentLink', [
            'amount' => (string) $amount,
            'currency' => $currency,
            'email' => config('payments.kazawallet.email'),
            'ref' => $this->getPaymentRef($request->user()),
            'redirectUrl' => route('deposit.callback'),
        ]);

        $payload = $response->json() ?? [];
        $paymentUrl = $this->extractPaymentLinkUrl($payload);

        return response()->json([
            'success' => $response->successful() && filled($paymentUrl),
            'url' => $paymentUrl,
            'message' => $response->successful()
                ? ($paymentUrl ? 'تم إنشاء رابط الدفع بنجاح.' : 'تم إنشاء الطلب لكن لم يتم العثور على رابط الدفع في الاستجابة.')
                : ($payload['message'] ?? 'تعذر إنشاء رابط الدفع من Kazawallet.'),
            'data' => $payload,
        ], $response->successful() ? 200 : 422);
    }

    public function depositCallback(Request $request): RedirectResponse
    {
        $user = $request->user() ?? Auth::user();

        if (! $user) {
            return redirect()->route('login')->with('success', 'تمت العودة من بوابة الدفع. سجّل الدخول لمتابعة حالة الإيداع.');
        }

        return redirect()->route('user.deposits', $user)->with('success', 'تمت العودة من بوابة الدفع. سيتم تحديث رصيدك تلقائيًا عند وصول إشعار الدفع.');
    }

    public function depositWebhook(Request $request): JsonResponse
    {
        Log::driver('deposits')->info('Incoming deposit webhook', $request->only([
            'order_id', 'amount', 'ref', 'status', 'currency',
        ]));

        $request->validate([
            'secret' => ['required', 'string'],
            'amount' => ['required', 'numeric'],
            'order_id' => ['required', 'string', 'max:255'],
            'ref' => ['required', 'string'],
            'status' => ['required', 'string'],
            'currency' => ['required', 'string'],
        ]);

        $paymentId = (string) $request->string('order_id');
        $originalAmount = (float) $request->input('amount');
        $userId = $this->getUserIdFromPaymentRef((string) $request->string('ref'));

        if (! $userId || ! User::query()->whereKey($userId)->exists()) {
            Log::driver('deposits')->warning('Deposit webhook with invalid ref', ['ref' => $request->input('ref')]);

            return response()->json(['message' => 'Invalid payment ref.'], 422);
        }

        $isValid = $this->checkPaymentValidity($originalAmount, $paymentId, (string) $request->string('secret'));
        $isPaid = $isValid && $request->string('status')->toString() === 'fulfilled';
        $creditedAmount = $this->normalizeCreditedAmount($originalAmount, (string) $request->string('currency'));
        $paymentMethodId = $this->getOrCreateKazawalletMethod()->id;

        DB::transaction(function () use ($paymentId, $userId, $creditedAmount, $isPaid, $paymentMethodId, $request) {
            $deposit = Deposit::query()->lockForUpdate()->firstOrNew([
                'paymentId' => $paymentId,
            ]);

            if (! $deposit->exists) {
                $fallbackDeposit = Deposit::query()
                    ->lockForUpdate()
                    ->where('user_id', $userId)
                    ->where('payment_method_id', $paymentMethodId)
                    ->where('status', 0)
                    ->whereRaw('ABS(amount - ?) < 0.01', [$creditedAmount])
                    ->where('notes', 'like', '[manual-fallback]%')
                    ->latest()
                    ->first();

                if ($fallbackDeposit) {
                    $deposit = $fallbackDeposit;
                    $deposit->paymentId = $paymentId;
                }
            }

            $wasPaid = (int) $deposit->status === 1;

            $deposit->support_id = $deposit->support_id ?: 'DEP-' . Str::upper(Str::random(10));
            $deposit->user_id = $userId;
            $deposit->amount = round($creditedAmount, 2);
            $deposit->status = $isPaid ? 1 : 2;
            $deposit->payment_method_id = $paymentMethodId;
            $deposit->notes = 'Kazawallet webhook: ' . $request->string('status');
            $deposit->save();

            if ($isPaid && ! $wasPaid) {
                $user = User::query()->lockForUpdate()->findOrFail($userId);
                $balanceBefore = (float) $user->balance;
                $user->balance = round((float) $user->balance + $creditedAmount, 2);
                $user->save();

                WalletTransaction::create([
                    'user_id' => $userId,
                    'type' => 'deposit',
                    'direction' => 'credit',
                    'amount' => $creditedAmount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $user->balance,
                    'description' => 'إيداع رصيد عبر Kazawallet (webhook)',
                    'reference_type' => Deposit::class,
                    'reference_id' => $deposit->id,
                    'meta' => ['source' => 'kazawallet_webhook'],
                ]);

                Notification::create([
                    'title' => 'إيداع رصيد',
                    'message' => $creditedAmount . ' points has been added to your balance.',
                    'sender_id' => 1,
                    'receiver_id' => $userId,
                ]);
            }
        });

        return response()->json([
            'message' => 'Webhook processed successfully.',
            'paid' => $isPaid,
        ]);
    }


    protected function storeAutomaticApiSyriaDeposit(StoreDepositRequest $request, PaymentMethod $paymentMethod, array $validated): RedirectResponse
    {
        $paymentId = trim((string) ($validated['paymentId'] ?? ''));
        $account = trim((string) $paymentMethod->account);
        $requestedUsdAmount = round((float) ($validated['amount'] ?? 0), 2);
        $usdRate = (float) Setting::get('payments.deposit_usd_to_syp_rate', config('payments.credit_price', 1));
        $requiredLocalAmount = round($requestedUsdAmount * max(1, $usdRate), 2);

        if ($account === '') {
            return back()->withErrors([
                'paymentMethodId' => 'هذه الوسيلة الأوتوماتيكية غير مكتملة الإعداد. أضف الحساب المرتبط في لوحة الإدارة أولًا.',
            ]);
        }

        if ($paymentId === '') {
            return back()->withErrors([
                'paymentId' => 'رقم العملية مطلوب للتحقق من الدفع.',
            ]);
        }

        $lookup = $paymentMethod->provider === 'apisyria_shamcash'
            ? $this->apiSyriaGateway->findShamCashTransaction($paymentId, $account)
            : $this->apiSyriaGateway->findSyriatelTransaction($paymentId, $account);

        $transaction = $this->extractApiSyriaTransaction($lookup);
        $transactionFound = $this->apiSyriaTransactionFound($lookup, $transaction);

        if (! ($lookup['success'] ?? false) || ! $transactionFound) {
            $this->createPendingApiSyriaDeposit($request, $paymentMethod, $validated, $paymentId, $requestedUsdAmount, $requiredLocalAmount, $lookup);

            return redirect()
                ->route('user.deposits', $request->user())
                ->with('warning', 'لم تصل العملية بعد أو لم يتم العثور عليها. تم إنشاء طلب إيداع قيد المعالجة، وإذا لم يتم التحقق منه خلال 5 دقائق سيبقى للمراجعة من قبل الإدارة.');
        }

        $externalAmount = $this->extractApiSyriaTransactionAmount($transaction);
        if ($externalAmount > 0 && $externalAmount + 0.0001 < $requiredLocalAmount) {
            $this->createPendingApiSyriaDeposit($request, $paymentMethod, $validated, $paymentId, $requestedUsdAmount, $requiredLocalAmount, $lookup, 'المبلغ المرسل أقل من المبلغ المطلوب.');

            return redirect()
                ->route('user.deposits', $request->user())
                ->with('warning', 'تم العثور على العملية لكن المبلغ أقل من المطلوب. تم تحويل الطلب للمراجعة من قبل الإدارة.');
        }

        try {
            DB::transaction(function () use ($request, $paymentMethod, $paymentId, $validated, $requestedUsdAmount, $requiredLocalAmount) {
                if (Deposit::query()->where('paymentId', $paymentId)->lockForUpdate()->exists()) {
                    throw new \RuntimeException('رقم العملية هذا مستخدم مسبقًا، ولا يمكن تكرار الشحن بنفس الرقم.');
                }

                $deposit = Deposit::create([
                    'support_id' => 'DEP-' . Str::upper(Str::random(10)),
                    'user_id' => $request->user()->id,
                    'amount' => $requestedUsdAmount,
                    'status' => 1,
                    'paymentId' => $paymentId,
                    'payment_method_id' => $paymentMethod->id,
                    'notes' => trim('API Syria auto verified | USD=' . $requestedUsdAmount . ' | Required local=' . $requiredLocalAmount . ' | ' . ($validated['notes'] ?? '')),
                    'image' => null,
                ]);

                $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
                $balanceBefore = (float) $user->balance;
                $user->balance = round($balanceBefore + (float) $deposit->amount, 2);
                $user->save();

                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'deposit',
                    'direction' => 'credit',
                    'amount' => $deposit->amount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $user->balance,
                    'description' => 'إيداع رصيد معتمد تلقائيًا',
                    'reference_type' => Deposit::class,
                    'reference_id' => $deposit->id,
                    'meta' => ['source' => 'deposit_auto_verified'],
                ]);

                if ((float) $deposit->amount >= 10) {
                    FortuneWheelController::grantSpin($user, 'deposit_10_bonus', 'إيداع تلقائي بقيمة 10$ أو أكثر');
                }
                $this->grantReferralWheelSpinIfEligible($user);

                Notification::create([
                    'title' => 'إيداع رصيد',
                    'message' => 'تم التحقق من العملية وإضافة الرصيد تلقائيًا إلى حسابك.',
                    'sender_id' => 1,
                    'receiver_id' => $user->id,
                ]);
            });
        } catch (\RuntimeException $exception) {
            return back()->withErrors([
                'paymentId' => $exception->getMessage(),
            ]);
        }

        return redirect()->route('user.deposits', $request->user())->with('success', 'تم التحقق من العملية وإضافة الرصيد فورًا.');
    }

    protected function createPendingApiSyriaDeposit(
        StoreDepositRequest $request,
        PaymentMethod $paymentMethod,
        array $validated,
        string $paymentId,
        float $requestedUsdAmount,
        float $requiredLocalAmount,
        array $lookup,
        ?string $reason = null
    ): Deposit {
        return DB::transaction(function () use ($request, $paymentMethod, $validated, $paymentId, $requestedUsdAmount, $requiredLocalAmount, $reason) {
            if (Deposit::query()->where('paymentId', $paymentId)->lockForUpdate()->exists()) {
                throw new \RuntimeException('رقم العملية هذا مستخدم مسبقًا، ولا يمكن تكرار الشحن بنفس الرقم.');
            }

            return Deposit::create([
                'support_id' => 'DEP-' . Str::upper(Str::random(10)),
                'user_id' => $request->user()->id,
                'amount' => $requestedUsdAmount,
                'status' => 0,
                'paymentId' => $paymentId,
                'payment_method_id' => $paymentMethod->id,
                'notes' => trim(
                    'API Syria pending review | USD=' . $requestedUsdAmount .
                    ' | Required local=' . $requiredLocalAmount .
                    ' | Review after=' . now()->addMinutes(5)->toDateTimeString() .
                    ($reason ? ' | Reason=' . $reason : '') .
                    ' | ' . ($validated['notes'] ?? '')
                ),
                'image' => null,
            ]);
        });
    }

    protected function extractApiSyriaTransaction(array $lookup): array
    {
        $payload = (array) ($lookup['payload'] ?? []);
        $data = (array) ($lookup['data'] ?? []);

        $candidates = [
            $data['transaction'] ?? null,
            $data['tx'] ?? null,
            $data['operation'] ?? null,
            $data['record'] ?? null,
            $data,
            $payload['transaction'] ?? null,
            $payload['data']['transaction'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_array($candidate) && $candidate !== []) {
                return $candidate;
            }
        }

        return [];
    }

    protected function apiSyriaTransactionFound(array $lookup, array $transaction): bool
    {
        $data = (array) ($lookup['data'] ?? []);
        $payload = (array) ($lookup['payload'] ?? []);

        if (array_key_exists('found', $data)) {
            return (bool) $data['found'];
        }

        if (array_key_exists('found', $payload)) {
            return (bool) $payload['found'];
        }

        return $transaction !== [];
    }

    protected function extractApiSyriaTransactionAmount(array $transaction): float
    {
        foreach (['amount', 'value', 'total', 'paid_amount', 'money'] as $key) {
            if (isset($transaction[$key]) && is_numeric($transaction[$key])) {
                return (float) $transaction[$key];
            }
        }

        return 0.0;
    }

    public function getPaymentRef(User $user): string
    {
        return $user->id . config('payments.kazawallet.ref_token', '');
    }

    public function getUserIdFromPaymentRef(string $paymentRef): ?int
    {
        $token = config('payments.kazawallet.ref_token', '');
        $position = strpos($paymentRef, $token);

        if ($token === '' || $position === false) {
            return null;
        }

        $userId = substr($paymentRef, 0, $position);

        return ctype_digit((string) $userId) ? (int) $userId : null;
    }

    public function checkPaymentValidity(float $amount, string $orderId, string $secret): bool
    {
        $kazawalletApiKey = config('payments.kazawallet.api_key');
        $kazawalletApiSecret = config('payments.kazawallet.secret');

        $secretString = $amount . ':::' . $orderId . ':::' . $kazawalletApiKey;
        $hashDigest = hash('sha256', $secretString, true);
        $hmacDigest = hash_hmac('sha512', $hashDigest, $kazawalletApiSecret, true);
        $hmacDigestBase64 = base64_encode($hmacDigest);

        return hash_equals($hmacDigestBase64, $secret);
    }

    public function updateStatus(UpdateDepositStatusRequest $request, Deposit $deposit): RedirectResponse
    {
        $newStatus = (int) $request->validated('status');

        try {
            DB::transaction(function () use ($deposit, $newStatus) {
                $lockedDeposit = Deposit::query()->with('user')->lockForUpdate()->findOrFail($deposit->id);
                $currentStatus = (int) $lockedDeposit->status;

                if ($currentStatus === 1 && $newStatus !== 1) {
                    throw new \RuntimeException('لا يمكن تغيير عملية إيداع مدفوعة إلى حالة أخرى لتجنب عدم اتساق الرصيد.');
                }

                if ($currentStatus !== 1 && $newStatus === 1) {
                    $duplicateApproved = Deposit::query()
                        ->where('id', '!=', $lockedDeposit->id)
                        ->where('user_id', $lockedDeposit->user_id)
                        ->where('payment_method_id', $lockedDeposit->payment_method_id)
                        ->where('status', 1)
                        ->when($lockedDeposit->paymentId, fn ($query) => $query->where('paymentId', $lockedDeposit->paymentId))
                        ->exists();

                    if ($duplicateApproved) {
                        throw new \RuntimeException('تمت الموافقة سابقًا على عملية مماثلة لهذه الوسيلة/المرجع، تم إيقاف العملية لتجنب إضافة الرصيد مرتين.');
                    }

                    $user = User::query()->lockForUpdate()->findOrFail($lockedDeposit->user_id);
                    $balanceBefore = (float) $user->balance;
                    $user->balance = round($balanceBefore + (float) $lockedDeposit->amount, 2);
                    $user->save();

                    WalletTransaction::create([
                        'user_id' => $user->id,
                        'type' => 'deposit',
                        'direction' => 'credit',
                        'amount' => $lockedDeposit->amount,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $user->balance,
                        'description' => 'إيداع رصيد معتمد من الإدارة',
                        'reference_type' => Deposit::class,
                        'reference_id' => $lockedDeposit->id,
                        'admin_id' => auth()->id(),
                        'meta' => ['source' => 'deposit_admin_approved'],
                    ]);

                    if ((float) $lockedDeposit->amount >= 10) {
                        FortuneWheelController::grantSpin($user, 'deposit_10_bonus', 'إيداع بقيمة 10$ أو أكثر', auth()->id());
                    }
                    $this->grantReferralWheelSpinIfEligible($user);
                }

                $lockedDeposit->status = $newStatus;
                $lockedDeposit->save();
            });
        } catch (\RuntimeException $exception) {
            return back()->withErrors([
                'status' => $exception->getMessage(),
            ]);
        }

        return back()->with('success', 'تم تحديث حالة الإيداع بنجاح.');
    }

    protected function normalizeCreditedAmount(float $amount, string $currency): float
    {
        if ($currency === 'SYP') {
            $creditPrice = (float) config('payments.credit_price', 1);

            if ($creditPrice <= 0) {
                return $amount;
            }

            return round($amount / $creditPrice, 2);
        }

        return round($amount, 2);
    }


    /**
     * Grant a wheel spin to the user's referrer if they've reached the referral milestone.
     * (3 successful referral deposits = 1 bonus spin for the referrer)
     */
    protected function grantReferralWheelSpinIfEligible(User $user): void
    {
        if (! $user->referred_by_user_id) {
            return;
        }

        $referrer = User::query()->find($user->referred_by_user_id);
        if (! $referrer) {
            return;
        }

        // Count how many of the referrer's referrals have at least 1 approved deposit
        $qualifiedReferrals = User::query()
            ->where('referred_by_user_id', $referrer->id)
            ->whereHas('deposits', fn ($query) => $query->where('status', 1))
            ->count();

        // Grant spin every 3 qualified referrals
        if ($qualifiedReferrals > 0 && $qualifiedReferrals % 3 === 0) {
            FortuneWheelController::grantSpin($referrer, 'referral_milestone', "إحالة {$qualifiedReferrals} مستخدم مؤهل");
        }
    }

    protected function getOrCreateKazawalletMethod(): PaymentMethod
    {
        return PaymentMethod::query()->firstOrCreate(
            ['provider' => 'kazawallet'],
            [
                'name' => 'Kazawallet',
                'status' => true,
                'is_automatic' => true,
                'requires_payment_id' => false,
                'requires_image' => false,
                'account' => config('payments.kazawallet.email', 'Automatic payment link'),
                'notes' => 'Created automatically for Kazawallet webhook reconciliation.',
                'config' => ['provider' => 'kazawallet'],
            ],
        );
    }

    protected function extractPaymentLinkUrl(array $payload): ?string
    {
        $candidates = [
            $payload['url'] ?? null,
            $payload['payment_url'] ?? null,
            $payload['paymentLink'] ?? null,
            $payload['payment_link'] ?? null,
            $payload['data']['url'] ?? null,
            $payload['data']['payment_url'] ?? null,
            $payload['data']['paymentLink'] ?? null,
            $payload['data']['payment_link'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && filter_var($candidate, FILTER_VALIDATE_URL)) {
                return $candidate;
            }
        }

        return $this->findFirstUrl($payload);
    }

    protected function findFirstUrl(mixed $value): ?string
    {
        if (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        if (! is_array($value)) {
            return null;
        }

        foreach ($value as $item) {
            $url = $this->findFirstUrl($item);
            if ($url) {
                return $url;
            }
        }

        return null;
    }
}

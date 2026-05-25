<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransferMoneyRequest;
use App\Http\Utility\PaymentUtility;
use App\Models\Card;
use App\Models\GiftCard;
use App\Models\Deposit;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\ReferralWithdrawal;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\Providers\ProviderGateway;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Throwable;

class UserController extends Controller
{
    public function __construct(protected ProviderGateway $providerGateway)
    {
    }

    public function index(Request $request): Response
    {
        $users = User::query()
            ->with('roles')
            ->withCount('referrals')
            ->withSum(['deposits as total_deposited' => fn ($query) => $query->where('status', 1)], 'amount')
            ->withCount(['deposits as deposits_count' => fn ($query) => $query->where('status', 1)])
            ->withCount(['payments as successful_orders_count' => fn ($query) => $query->where('status', 1)])
            ->withSum(['payments as total_spent' => fn ($query) => $query->where('status', 1)], 'price')
            ->withSum(['payments as total_profit' => fn ($query) => $query->where('status', 1)], 'profit_amount')
            ->when($request->filled('type'), function (Builder $query) use ($request) {
                $query->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('name', '=', $request->string('type')));
            })
            ->latest()
            ->paginate(10)
            ->through(function (User $user) {
                $spent = (float) ($user->total_spent ?? 0);
                $profit = (float) ($user->total_profit ?? 0);
                $deposited = (float) ($user->total_deposited ?? 0);
                $level = $this->resolveCustomerLevel($user, $spent);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'balance' => $user->balance,
                    'roles' => $user->roles,
                    'is_blocked' => $user->is_blocked,
                    'special_price_discount_percentage' => $user->special_price_discount_percentage,
                    'reseller_markup_percentage' => $user->reseller_markup_percentage,
                    'customer_level' => $level,
                    'api_enabled' => (bool) $user->api_enabled,
                    'referral_rate_percentage' => $user->referral_rate_percentage,
                    'referral_balance' => $user->referral_balance,
                    'total_referral_earnings' => $user->total_referral_earnings,
                    'total_deposited' => round($deposited, 2),
                    'total_spent' => round($spent, 2),
                    'total_profit' => round($profit, 2),
                    'profit_rate' => $spent > 0 ? round(($profit / $spent) * 100, 2) : 0,
                    'consumption_rate' => $deposited > 0 ? round(($spent / $deposited) * 100, 2) : 0,
                    'successful_orders_count' => (int) ($user->successful_orders_count ?? 0),
                    'deposits_count' => (int) ($user->deposits_count ?? 0),
                    'referrals_count' => (int) ($user->referrals_count ?? 0),
                ];
            })
            ->withQueryString();

        return Inertia::render('User/Index', [
            'users' => $users,
            'filters' => $request->only('type'),
            'levelSettings' => [
                'level2Threshold' => (float) Setting::get('levels.level2_threshold', 250),
                'level3Threshold' => (float) Setting::get('levels.level3_threshold', 1000),
                'level4Threshold' => (float) Setting::get('levels.level4_threshold', 2500),
                'level2DiscountPercentage' => (float) Setting::get('levels.level2_discount_percentage', 0),
                'level3DiscountPercentage' => (float) Setting::get('levels.level3_discount_percentage', 0),
                'level4DiscountPercentage' => (float) Setting::get('levels.level4_discount_percentage', 0),
            ],
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $user->load('roles', 'referrer');
        $spent = (float) $user->payments()->where('status', 1)->sum('price');
        $this->syncCustomerLevel($user);

        return Inertia::render('User/Edit', [
            'user' => array_merge($user->toArray(), [
                'stats' => $this->getUserStats($user),
            ]),
            'roles' => Role::all(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'balance' => ['nullable', 'numeric', 'min:0'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
            'isBlocked' => ['required', 'boolean'],
            'specialPriceDiscountPercentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'resellerMarkupPercentage' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'referralRatePercentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'apiEnabled' => ['required', 'boolean'],
            'regenerateApiToken' => ['nullable', 'boolean'],
            'wheelSpinsToAdd' => ['nullable', 'integer', 'min:0', 'max:100'],
            'wheelSpinsToRemove' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $balanceBefore = (float) $user->balance;
        $balanceChangedByAdmin = false;

        if (array_key_exists('balance', $validated)) {
            $nextBalance = round((float) $validated['balance'], 8);
            $balanceChangedByAdmin = abs($nextBalance - $balanceBefore) > 0.00000001;
            $user->balance = $nextBalance;
        }

        $user->is_blocked = (bool) $validated['isBlocked'];
        $user->special_price_discount_percentage = $validated['specialPriceDiscountPercentage'] ?? 0;
        $user->reseller_markup_percentage = $validated['resellerMarkupPercentage'] ?? 0;
        $user->referral_rate_percentage = $validated['referralRatePercentage'] ?? $user->referral_rate_percentage;
        $user->api_enabled = (bool) $validated['apiEnabled'];

        if ($user->api_enabled && (! $user->api_token || ! empty($validated['regenerateApiToken']))) {
            $user->api_token = 'sh7nle_' . Str::random(40);
        }

        if (! $user->referral_code) {
            $user->referral_code = $this->generateReferralCode();
        }

        $spent = (float) $user->payments()->where('status', 1)->sum('price');
        $this->syncCustomerLevel($user);

        $roleName = $validated['role'] ?? 'Normal';
        if ($user->api_enabled) {
            $roleName = 'ApiClient';
        }

        $user->syncRoles([$roleName]);
        $user->save();

        if ($balanceChangedByAdmin) {
            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'admin_adjustment',
                'direction' => (float) $user->balance >= $balanceBefore ? 'credit' : 'debit',
                'amount' => abs(round((float) $user->balance - $balanceBefore, 8)),
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance,
                'description' => 'تعديل رصيد من لوحة الإدارة',
                'admin_id' => auth()->id(),
                'meta' => ['source' => 'admin_user_edit'],
            ]);
        }

        $spinsToAdd = (int) ($validated['wheelSpinsToAdd'] ?? 0);
        if ($spinsToAdd > 0) {
            for ($i = 0; $i < $spinsToAdd; $i++) {
                \App\Http\Controllers\FortuneWheelController::grantSpin($user, 'admin_user_edit', 'تعديل من صفحة المستخدم', auth()->id());
            }
        }

        $spinsToRemove = (int) ($validated['wheelSpinsToRemove'] ?? 0);
        if ($spinsToRemove > 0 && \Illuminate\Support\Facades\Schema::hasTable('wheel_spins')) {
            $user->wheelSpins()->active()->oldest('expires_at')->take($spinsToRemove)->get()->each(fn ($spin) => $spin->update(['status' => 'cancelled']));
        }

        return redirect()->route('user.index')->with('success', 'تم تحديث المستخدم بنجاح.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('user.index')->with('success', 'تم حذف المستخدم بنجاح.');
    }

    public function account(Request $request): Response
    {
        $user = $request->user()->load('roles');
        if (! $user->referral_code) {
            $user->referral_code = $this->generateReferralCode();
            $user->save();
        }

        $stats = $this->getUserStats($user);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'profile' => $user->only(['name', 'email', 'whatsapp_number', 'account_verification_status', 'account_verification_notes']) + [
                'two_factor_enabled' => ! is_null($user->two_factor_secret),
                'api_enabled' => (bool) $user->api_enabled,
                'customer_level' => $stats['customerLevel'],
                'api_token_preview' => $user->api_token ? substr($user->api_token, 0, 12) . '…' : null,
            ],
            'referralLink' => route('register', ['ref' => $user->referral_code], false),
            'referralWithdrawals' => $user->referralWithdrawals()->with('paymentMethod')->latest()->take(8)->get(),
            'referralWithdrawalMethods' => PaymentMethod::query()->where('available_for_referral_withdrawal', true)->where('status', true)->get(),
            'loginActivities' => \Illuminate\Support\Facades\Schema::hasTable('login_activities') ? $user->loginActivities()->latest()->take(12)->get() : collect(),
        ]);
    }


    public function referrals(Request $request): Response
    {
        $user = $request->user()->load('roles');
        if (! $user->referral_code) {
            $user->referral_code = $this->generateReferralCode();
            $user->save();
        }

        return Inertia::render('Referral/Index', [
            'stats' => $this->getUserStats($user),
            'referralLink' => route('register', ['ref' => $user->referral_code], false),
            'referralWithdrawals' => $user->referralWithdrawals()->with('paymentMethod')->latest()->take(12)->get(),
            'referralWithdrawalMethods' => PaymentMethod::query()->where('available_for_referral_withdrawal', true)->where('status', true)->get(),
            'loginActivities' => \Illuminate\Support\Facades\Schema::hasTable('login_activities') ? $user->loginActivities()->latest()->take(12)->get() : collect(),
        ]);
    }

    public function userPayments(Request $request, User $user): Response
    {
        $this->authorizeOwnUserRoute($user);

        $payments = $user->payments()->with('card')->latest()->paginate(15)->withQueryString();
        $updatedPayments = PaymentUtility::getPaymentsStatus(collect($payments->items()), $user)->values();
        $payments->setCollection($updatedPayments);
        $user->refresh();
        $this->syncCustomerLevel($user);

        return Inertia::render('Payment/Index', [
            'payments' => $payments,
            'user' => $user,
            'stats' => $this->getUserStats($user),
        ]);
    }

    public function buyCard(Request $request, User $user): RedirectResponse
    {
        $this->authorizeOwnUserRoute($user);

        $validated = $request->validate([
            'card.id' => ['required', 'integer', 'exists:cards,id'],
            'amount' => ['nullable', 'numeric', 'min:1'],
            'userId' => ['nullable', 'string', 'max:255'],
            'secondaryUserId' => ['nullable', 'string', 'max:255'],
            'providerValue' => ['nullable'],
            'clientRequestId' => ['nullable', 'string', 'max:120'],
        ]);

        $card = Card::query()->with('providerSource')->find((int) data_get($validated, 'card.id'));
        if (! $card) {
            return back()->withErrors(['card' => 'المنتج المطلوب غير موجود أو لم يعد متاحًا.']);
        }

        if (! $card->is_active || (bool) ($card->manual_unavailable ?? false) || ! is_null($card->provider_unavailable_at ?? null)) {
            return back()->withErrors(['card' => 'هذا المنتج غير متوفر حاليًا.']);
        }

        $requestedAmount = max(1, (int) $request->integer('amount'));
        $destinationProfileId = trim((string) $request->string('userId'));
        $secondaryProfileId = trim((string) $request->string('secondaryUserId'));
        $selectedProviderValue = $request->input('providerValue');
        $purchaseFlow = $this->getPurchaseFlow($card);

        if ($card->requires_player_id && $destinationProfileId === '') {
            return back()->withErrors(['userId' => 'هذا المنتج يتطلب إدخال معرف اللاعب أو الحساب.']);
        }

        if ($card->requires_secondary_player_id && $secondaryProfileId === '') {
            return back()->withErrors(['secondaryUserId' => 'هذا المنتج يتطلب إدخال المعرّف الثاني أو السيرفر.']);
        }

        $payloadValidation = $this->validatePurchasePayload($card, $purchaseFlow, $requestedAmount, $selectedProviderValue);
        if ($payloadValidation) {
            return back()->withErrors($payloadValidation);
        }

        [$copyCount, $providerQty, $unitPrice, $unitCost, $totalPrice, $selectedValue, $providerProductId] = $this->resolvePurchaseScenario(
            $card,
            $user,
            $purchaseFlow,
            $requestedAmount,
            $selectedProviderValue
        );

        $clientRequestId = trim((string) ($validated['clientRequestId'] ?? ''));
        $purchaseFingerprint = sha1(json_encode([
            'user_id' => $user->id,
            'card_id' => $card->id,
            'amount' => $requestedAmount,
            'provider_value' => $selectedProviderValue,
            'destination' => $destinationProfileId,
            'secondary' => $secondaryProfileId,
            'client_request_id' => $clientRequestId ?: null,
        ], JSON_UNESCAPED_UNICODE));
        $purchaseSubmissionKey = 'purchase_submission:' . $user->id . ':' . $purchaseFingerprint;

        if (! Cache::add($purchaseSubmissionKey, now()->toDateTimeString(), now()->addSeconds(75))) {
            return back()->withErrors(['card' => 'طلب الشراء قيد المعالجة بالفعل. انتظر ثواني وافتح صفحة طلباتي للتأكد قبل إعادة المحاولة.']);
        }

        if ((float) $user->balance < $totalPrice) {
            Cache::forget($purchaseSubmissionKey);
            return back()->withErrors(['amount' => 'الرصيد الحالي غير كافٍ لإتمام عملية الشراء.']);
        }

        $createdPayments = collect();
        $chargeablePrice = 0.0;
        $providerFailureMessage = null;
        $providerSource = $card->providerSource;
        $isInternalGiftCard = $card->delivery_mode === 'internal_gift_card';
        $isManualProduct = $isInternalGiftCard || (! $providerProductId || $providerProductId === '0') || ! $providerSource || $card->delivery_mode === 'manual_review';

        if ($isManualProduct) {
            $linePrice = round($totalPrice, 6);
            $lineCost = round($purchaseFlow === 'codes_quantity' ? ($unitCost * $copyCount) : ($purchaseFlow === 'player_custom_value' ? ($unitCost * $providerQty) : $unitCost), 6);
            $lineProfit = round($linePrice - $lineCost, 6);
            $chargeablePrice = $linePrice;
            $supportId = $this->generateSupportId('ORD');
            $orderUuid = (string) Str::uuid();

            $createdPayments->push([
                'support_id' => $supportId,
                'user_id' => $user->id,
                'card_id' => $card->id,
                'destinationProfileId' => $destinationProfileId,
                'orderId' => $supportId,
                'orderUuid' => $orderUuid,
                'amount' => $purchaseFlow === 'codes_quantity' ? $copyCount : $providerQty,
                'price' => $linePrice,
                'cost_price' => $lineCost,
                'profit_amount' => $lineProfit,
                'referral_commission_amount' => $isInternalGiftCard ? $this->calculateReferralCommission($user, $linePrice) : 0,
                'referral_commission_paid_at' => null,
                'status' => $isInternalGiftCard ? 1 : 0,
                'provider_status' => $isInternalGiftCard ? 'internal_gift_card_issued' : 'awaiting_admin_fulfillment',
                'delivered_codes' => null,
                'delivery_details' => [
                    'playerId' => $destinationProfileId,
                    'playerId2' => $secondaryProfileId,
                    'providerValue' => $selectedValue,
                    'providerProductId' => $providerProductId,
                    'flow' => $purchaseFlow,
                    'manual' => ! $isInternalGiftCard,
                    'internal_gift_card' => $isInternalGiftCard,
                    'gift_card_amount' => $isInternalGiftCard ? (float) ($selectedValue ?: $unitPrice) : null,
                    'gift_card_quantity' => $isInternalGiftCard ? (int) ($purchaseFlow === 'codes_quantity' ? $copyCount : 1) : null,
                ],
                'provider_payload' => $isInternalGiftCard ? ['internal_gift_card' => true] : ['manual' => true],
                'refunded_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            for ($index = 0; $index < $copyCount; $index++) {
                $orderUuid = (string) Str::uuid();
                $payload = ['qty' => $providerQty, 'order_uuid' => $orderUuid];

                if ($destinationProfileId !== '') {
                    $payload['playerId'] = $destinationProfileId;
                }

                if ($secondaryProfileId !== '') {
                    $payload['playerId2'] = $secondaryProfileId;
                }

                try {
                    $orderData = $this->providerGateway->order($providerSource, (string) $providerProductId, $payload);
                } catch (Throwable $exception) {
                    report($exception);
                    $providerFailureMessage = $this->normalizePurchaseFailureMessage($exception);
                    if (str_contains(mb_strtolower($providerFailureMessage), 'غير متوفر') || str_contains(mb_strtolower($providerFailureMessage), 'not found') || str_contains(mb_strtolower($providerFailureMessage), 'unavailable')) {
                        $card->forceFill(['provider_unavailable_at' => now(), 'availability_note' => $providerFailureMessage])->saveQuietly();
                    }
                    break;
                }

                if (! is_array($orderData) || ! isset($orderData['status'])) {
                    $providerFailureMessage = 'تعذر إتمام جزء من الطلب من المزود الخارجي. الاستجابة غير مفهومة.';
                    break;
                }

                $status = PaymentUtility::getStatusFromResponse($orderData);
                $deliveryBundle = PaymentUtility::extractDeliveryBundle($orderData);
                $isPerUnitCharge = $purchaseFlow === 'player_custom_value';
                $linePrice = round($isPerUnitCharge ? ($unitPrice * $providerQty) : $unitPrice, 6);
                $lineCost = round($isPerUnitCharge ? ($unitCost * $providerQty) : $unitCost, 6);
                $lineProfit = round($linePrice - $lineCost, 6);
                $referralCommission = $status === 1 ? $this->calculateReferralCommission($user, $linePrice) : 0;

                if ($status !== 2) {
                    $chargeablePrice += $linePrice;
                }

                $createdPayments->push([
                    'support_id' => $this->generateSupportId('ORD'),
                    'user_id' => $user->id,
                    'card_id' => $card->id,
                    'destinationProfileId' => $destinationProfileId,
                    'orderId' => (string) ($orderData['order_id'] ?? $orderUuid),
                    'orderUuid' => $orderUuid,
                    'amount' => $providerQty,
                    'price' => $linePrice,
                    'cost_price' => $lineCost,
                    'profit_amount' => $lineProfit,
                    'referral_commission_amount' => $referralCommission,
                    'referral_commission_paid_at' => null,
                    'status' => $status,
                    'provider_status' => $orderData['status'] ?? null,
                    'delivered_codes' => $deliveryBundle['codes_text'],
                    'delivery_details' => $deliveryBundle['details'],
                    'provider_payload' => array_merge($orderData, ['provider_product_id' => $providerProductId, 'provider_source_id' => $providerSource->id]),
                    'refunded_at' => $status === 2 ? now() : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($createdPayments->isEmpty()) {
                Cache::forget($purchaseSubmissionKey ?? '');
                return back()->withErrors(['card' => 'تعذر إتمام الشراء من المزود الخارجي. حاول مرة أخرى لاحقًا.']);
            }
        }

        try {
            DB::transaction(function () use ($user, $chargeablePrice, $createdPayments) {
                $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

                if ((float) $lockedUser->balance < $chargeablePrice) {
                    throw new \RuntimeException('الرصيد الحالي غير كافٍ لإتمام عملية الشراء.');
                }

                $balanceBefore = (float) $lockedUser->balance;
                $lockedUser->balance = round($balanceBefore - $chargeablePrice, 6);
                $lockedUser->save();

                $purchaseWalletTransaction = null;
                if ($chargeablePrice > 0) {
                    $isGiftCardPurchase = collect($createdPayments)->contains(fn ($payment) => ! empty(($payment['delivery_details'] ?? [])['internal_gift_card']));
                    $purchaseWalletTransaction = WalletTransaction::create([
                        'user_id' => $lockedUser->id,
                        'type' => $isGiftCardPurchase ? 'gift_card_purchase' : 'purchase',
                        'direction' => 'debit',
                        'amount' => $chargeablePrice,
                        'balance_before' => $balanceBefore,
                        'balance_after' => $lockedUser->balance,
                        'description' => $isGiftCardPurchase ? 'شراء Gift Card من المتجر' : 'شراء منتج من المتجر',
                        'reference_type' => Payment::class,
                        'reference_id' => null,
                        'meta' => [
                            'source' => 'store_purchase',
                            'payments_count' => $createdPayments->count(),
                        ],
                    ]);
                }

                $createdPaymentIds = [];
                foreach ($createdPayments as $createdPayment) {
                    $details = $createdPayment['delivery_details'] ?? [];

                    if (! empty($details['internal_gift_card'])) {
                        $quantity = max(1, (int) ($details['gift_card_quantity'] ?? 1));
                        $amount = max(1, (float) ($details['gift_card_amount'] ?? $createdPayment['price']));
                        $codes = [];
                        $giftCardIds = [];

                        for ($giftIndex = 0; $giftIndex < $quantity; $giftIndex++) {
                            $giftCard = GiftCardController::generate($amount, $lockedUser->id, 'store_purchase');
                            $codes[] = $giftCard->code;
                            $giftCardIds[] = $giftCard->id;
                        }

                        $createdPayment['delivered_codes'] = implode("
", $codes);
                        $createdPayment['delivery_details'] = array_merge($details, [
                            'gift_card_codes' => $codes,
                            'gift_card_ids' => $giftCardIds,
                        ]);
                    }

                    $payment = Payment::query()->create($createdPayment);
                    $createdPaymentIds[] = $payment->id;
                    PaymentUtility::applyReferralCommissionIfNeeded($payment);
                    Card::query()->whereKey($payment->card_id)->increment('order_count');
                }

                if ($purchaseWalletTransaction && count($createdPaymentIds) > 0) {
                    $purchaseWalletTransaction->forceFill([
                        'reference_id' => $createdPaymentIds[0],
                        'meta' => array_merge($purchaseWalletTransaction->meta ?? [], [
                            'payment_ids' => $createdPaymentIds,
                            'first_payment_id' => $createdPaymentIds[0],
                        ]),
                    ])->save();
                }

                $this->syncCustomerLevel($lockedUser);
            });
        } catch (\RuntimeException $exception) {
            if (! empty($purchaseSubmissionKey)) {
                Cache::forget($purchaseSubmissionKey);
            }
            return back()->withErrors(['amount' => $exception->getMessage()]);
        }

        Cache::put($purchaseSubmissionKey, 'completed', now()->addMinutes(5));

        return back()->with(
            $providerFailureMessage ? 'warning' : 'success',
            $providerFailureMessage ?: ($isInternalGiftCard ? 'تم شراء Gift Card بنجاح. ستجد الكود داخل صفحة طلباتي ويمكنك استرداده من زر Gift Card.' : ($isManualProduct ? 'تم استلام طلبك وسيظهر الآن للإدارة ضمن صفحة الطلبات لتنفيذه.' : 'تم إنشاء الطلب بنجاح.'))
        );
    }

    public function userDeposits(Request $request, User $user): Response
    {
        $this->authorizeOwnUserRoute($user);

        return Inertia::render('Deposit/Index', [
            'deposits' => $user->deposits()->with('paymentMethod')->latest()->paginate(20),
            'user' => $user,
            'stats' => $this->getUserStats($user),
        ]);
    }

    public function userNotifications(Request $request, User $user): Response
    {
        $this->authorizeOwnUserRoute($user);

        $userNotifications = Notification::query()
            ->where('receiver_id', $user->id)
            ->orWhereNull('receiver_id')
            ->with('sender', 'receiver')
            ->latest()
            ->get();

        Notification::query()->where('receiver_id', $user->id)->where('seen', false)->update(['seen' => true]);

        return Inertia::render('User/Notifications', ['notifications' => $userNotifications, 'user' => $user]);
    }

    public function showTransferMoneyPage(Request $request): Response
    {
        return Inertia::render('TransferMoney/Transfer');
    }

    public function updateAccountProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
            'whatsappNumber' => ['nullable', 'string', 'max:50'],
            'accountVerificationNotes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->whatsapp_number = $validated['whatsappNumber'] ?? null;
        if (array_key_exists('accountVerificationNotes', $validated) && trim((string) $validated['accountVerificationNotes']) !== '') {
            $user->account_verification_notes = $validated['accountVerificationNotes'];
            $user->account_verification_status = 'pending';
        }
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        return back()->with('success', 'تم تحديث بيانات الحساب بنجاح.');
    }

    public function updateAccountPassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'currentPassword' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['currentPassword'], $user->password)) {
            return back()->withErrors(['currentPassword' => 'كلمة المرور الحالية غير صحيحة.']);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        if (\Illuminate\Support\Facades\Schema::hasTable('login_activities')) {
            \App\Models\LoginActivity::create([
                'user_id' => $user->id,
                'event' => 'password_changed',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'browser' => 'Unknown',
                'platform' => 'Unknown',
                'device_type' => 'Unknown',
                'is_new_device' => false,
            ]);
        }

        try {
            \Illuminate\Support\Facades\Mail::raw('تم تغيير كلمة مرور حسابك في Sh7nle. إذا لم تكن أنت، تواصل مع الدعم فورًا.', function ($message) use ($user) {
                $message->to($user->email)->subject('تم تغيير كلمة مرور حسابك في Sh7nle');
            });
        } catch (\Throwable $exception) {
            report($exception);
        }

        return back()->with('success', 'تم تغيير كلمة المرور بنجاح.');
    }

    public function transferMoney(TransferMoneyRequest $request): RedirectResponse
    {
        $sender = $request->user();
        $amount = (float) $request->input('amount');
        $receiver = User::query()->where('email', $request->string('email'))->firstOrFail();

        if ($sender->id === $receiver->id) {
            return back()->withErrors(['email' => 'لا يمكنك تحويل الرصيد إلى نفس الحساب.']);
        }

        try {
            DB::transaction(function () use ($sender, $receiver, $amount) {
                $lockedSender = User::query()->lockForUpdate()->findOrFail($sender->id);
                $lockedReceiver = User::query()->lockForUpdate()->findOrFail($receiver->id);

                if ((float) $lockedSender->balance < $amount) {
                    throw new \RuntimeException('الرصيد الحالي غير كافٍ لإتمام عملية التحويل.');
                }

                $senderBefore = (float) $lockedSender->balance;
                $receiverBefore = (float) $lockedReceiver->balance;

                $lockedSender->balance = round($senderBefore - $amount, 2);
                $lockedReceiver->balance = round($receiverBefore + $amount, 2);

                $lockedSender->save();
                $lockedReceiver->save();

                WalletTransaction::create([
                    'user_id' => $lockedSender->id,
                    'type' => 'transfer_out',
                    'direction' => 'debit',
                    'amount' => $amount,
                    'balance_before' => $senderBefore,
                    'balance_after' => $lockedSender->balance,
                    'description' => 'تحويل رصيد إلى ' . $lockedReceiver->email,
                    'reference_type' => User::class,
                    'reference_id' => $lockedReceiver->id,
                    'meta' => ['source' => 'user_transfer'],
                ]);

                WalletTransaction::create([
                    'user_id' => $lockedReceiver->id,
                    'type' => 'transfer_in',
                    'direction' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $receiverBefore,
                    'balance_after' => $lockedReceiver->balance,
                    'description' => 'تحويل رصيد من ' . $lockedSender->email,
                    'reference_type' => User::class,
                    'reference_id' => $lockedSender->id,
                    'meta' => ['source' => 'user_transfer'],
                ]);

                Deposit::create([
                    'support_id' => $this->generateSupportId('DEP'),
                    'user_id' => $lockedReceiver->id,
                    'amount' => $amount,
                    'status' => 1,
                    'paymentId' => 'transfer:' . Str::uuid(),
                    'notes' => 'رصيد محوّل من ' . $lockedSender->email,
                ]);

                Notification::create([
                    'title' => 'تحويل رصيد',
                    'message' => "تم تحويل {$amount} نقطة إلى حسابك من {$lockedSender->name}.",
                    'sender_id' => $lockedSender->id,
                    'receiver_id' => $lockedReceiver->id,
                ]);
            });
        } catch (\RuntimeException $exception) {
            return back()->withErrors(['amount' => $exception->getMessage()]);
        }

        return redirect()->route('account')->with('success', 'تم تحويل الرصيد بنجاح.');
    }

    protected function authorizeOwnUserRoute(User $user): void
    {
        abort_unless((int) auth()->id() === (int) $user->id, 403);
    }

    protected function validateRequestedAmount(Card $card, int $requestedAmount): ?string
    {
        $quantityLabel = $card->quantity_label ?: 'الكمية';
        $min = max(1, (int) ($card->minAmount ?? 1));
        $max = $card->maxAmount !== null ? max($min, (int) $card->maxAmount) : null;

        if ($requestedAmount < $min) {
            return "{$quantityLabel} المطلوبة أقل من الحد الأدنى المسموح.";
        }

        if ($max !== null && $requestedAmount > $max) {
            return "{$quantityLabel} المطلوبة خارج المجال المسموح لهذا المنتج.";
        }

        return null;
    }

    protected function getPurchaseFlow(Card $card): string
    {
        if ($card->purchase_flow) {
            return $card->purchase_flow;
        }

        if ($card->requires_secondary_player_id) {
            return 'player_and_server';
        }

        if ($card->amount_mode === 'custom_value') {
            return 'player_custom_value';
        }

        if ($card->requires_player_id) {
            return 'player_category';
        }

        if (is_array($card->provider_qty_values) && array_is_list($card->provider_qty_values) && count($card->provider_qty_values) > 1) {
            return 'codes_quantity';
        }

        return 'direct_purchase';
    }

    protected function validatePurchasePayload(Card $card, string $purchaseFlow, int $requestedAmount, mixed $selectedProviderValue): ?array
    {
        $providerQtyValues = $card->provider_qty_values;
        $usesMappedProviderOptions = $this->usesMappedProviderOptions($card);

        if (in_array($purchaseFlow, ['player_category', 'codes_quantity', 'player_and_server', 'direct_purchase'], true) && is_array($providerQtyValues) && array_is_list($providerQtyValues) && count($providerQtyValues) > 0) {
            if ($selectedProviderValue === null || $selectedProviderValue === '') {
                return ['providerValue' => 'اختر الفئة المطلوبة قبل إتمام الشراء.'];
            }

            $allowedValues = collect($providerQtyValues)->map(fn ($value) => (string) $value)->all();
            if (! in_array((string) $selectedProviderValue, $allowedValues, true)) {
                return ['providerValue' => 'الفئة المطلوبة غير متاحة لهذا المنتج.'];
            }

            if ($usesMappedProviderOptions && ! $this->resolveProviderProductId($card, $selectedProviderValue)) {
                return ['providerValue' => 'هذا الخيار غير مربوط بمنتج فعلي عند المزود.'];
            }

            if ($purchaseFlow === 'codes_quantity' && $requestedAmount < 1) {
                return ['amount' => 'حدد عدد النسخ المطلوبة.'];
            }

            return null;
        }

        $validationError = $this->validateRequestedAmount($card, $requestedAmount);

        return $validationError ? ['amount' => $validationError] : null;
    }

    protected function resolvePurchaseScenario(Card $card, User $user, string $purchaseFlow, int $requestedAmount, mixed $selectedProviderValue): array
    {
        $selectedValue = ($selectedProviderValue !== null && $selectedProviderValue !== '') ? (string) $selectedProviderValue : null;
        $usesMappedProviderOptions = $this->usesMappedProviderOptions($card);
        $providerProductId = $this->resolveProviderProductId($card, $selectedValue);

        if ($purchaseFlow === 'codes_quantity') {
            $providerQty = $usesMappedProviderOptions ? 1 : ((int) $selectedValue ?: 1);
            $copyCount = max(1, $requestedAmount);
            $unitPrice = $this->getEffectiveUnitPrice($card, $user, $selectedValue);
            $unitCost = $this->getEffectiveUnitCost($card, $selectedValue);
            $totalPrice = round($unitPrice * $copyCount, 2);

            return [$copyCount, $providerQty, $unitPrice, $unitCost, $totalPrice, $selectedValue, $providerProductId];
        }

        if ($purchaseFlow === 'player_custom_value') {
            $providerQty = max(1, $requestedAmount);
            $copyCount = 1;
            $unitPrice = $this->getEffectiveUnitPrice($card, $user);
            $unitCost = $this->getEffectiveUnitCost($card);
            $totalPrice = round($unitPrice * $providerQty, 2);

            return [$copyCount, $providerQty, $unitPrice, $unitCost, $totalPrice, $selectedValue, $providerProductId];
        }

        if ($purchaseFlow === 'direct_purchase') {
            $providerQty = $usesMappedProviderOptions ? 1 : max(1, ($selectedValue !== null ? (int) $selectedValue : (int) ($card->minAmount ?: 1)));
            $copyCount = 1;
            $unitPrice = $this->getEffectiveUnitPrice($card, $user, $selectedValue);
            $unitCost = $this->getEffectiveUnitCost($card, $selectedValue);
            $totalPrice = round($unitPrice, 2);

            return [$copyCount, $providerQty, $unitPrice, $unitCost, $totalPrice, $selectedValue, $providerProductId];
        }

        $providerQty = $usesMappedProviderOptions ? 1 : ($selectedValue !== null ? (int) $selectedValue : max(1, $requestedAmount));
        $copyCount = 1;
        $unitPrice = $this->getEffectiveUnitPrice($card, $user, $selectedValue);
        $unitCost = $this->getEffectiveUnitCost($card, $selectedValue);
        $totalPrice = round($unitPrice, 2);

        return [$copyCount, $providerQty, $unitPrice, $unitCost, $totalPrice, $selectedValue, $providerProductId];
    }

    protected function getEffectiveUnitPrice(Card $card, User $user, mixed $selectedValue = null): float
    {
        $globalMarkup = (float) Setting::get('pricing.global_markup_percentage', 0);
        $specialDiscountPercentage = (float) $user->special_price_discount_percentage;
        $hasResellerPricing = (bool) $user->api_enabled || (float) $user->reseller_markup_percentage > 0;

        if ($hasResellerPricing) {
            $baseCost = $this->getEffectiveUnitCost($card, $selectedValue);
            $price = $baseCost * (1 + ((float) $user->reseller_markup_percentage / 100));

            return round($price, 2);
        }

        $basePrice = $selectedValue !== null && is_array($card->option_prices) && array_key_exists((string) $selectedValue, $card->option_prices)
            ? (float) $card->option_prices[(string) $selectedValue]
            : (float) $card->price;

        $price = $basePrice * (1 + ($globalMarkup / 100));
        $price = $price * (1 - ($specialDiscountPercentage / 100));

        return round($price, 2);
    }

    protected function getEffectiveUnitCost(Card $card, mixed $selectedValue = null): float
    {
        if ($selectedValue !== null && is_array($card->option_costs) && array_key_exists((string) $selectedValue, $card->option_costs)) {
            return round((float) $card->option_costs[(string) $selectedValue], 2);
        }

        $providerCost = (float) ($card->cost_price ?: $card->provider_cost_price ?: 0);

        return round($providerCost, 2);
    }

    protected function usesMappedProviderOptions(Card $card): bool
    {
        return is_array($card->provider_option_product_ids) && ! empty($card->provider_option_product_ids);
    }

    protected function resolveProviderProductId(Card $card, mixed $selectedValue = null): ?string
    {
        if ($this->usesMappedProviderOptions($card) && $selectedValue !== null) {
            $productId = $card->provider_option_product_ids[(string) $selectedValue] ?? null;

            return filled($productId) ? (string) $productId : null;
        }

        if (filled($card->provider_product_id)) {
            return (string) $card->provider_product_id;
        }

        return filled($card->sawaCardId) ? (string) $card->sawaCardId : null;
    }

    protected function calculateReferralCommission(User $buyer, float $linePrice): float
    {
        if (! $buyer->referrer) {
            return 0.0;
        }

        return round($linePrice * ((float) $buyer->referrer->referral_rate_percentage / 100), 2);
    }


    protected function normalizePurchaseFailureMessage(Throwable $exception): string
    {
        $message = trim((string) $exception->getMessage());
        $haystack = mb_strtolower($message);

        if ($haystack === '' || str_contains($haystack, '404')) {
            return 'المنتج أو الخدمة غير متاحة حاليًا لدى المزود.';
        }

        if (str_contains($haystack, 'insufficient') || str_contains($haystack, 'balance') || str_contains($haystack, 'رصيد')) {
            return 'الرصيد غير كافٍ لإتمام عملية الشراء.';
        }

        if (str_contains($haystack, 'rate limit') || str_contains($haystack, 'too many requests') || str_contains($haystack, '429')) {
            return 'المزود الخارجي مشغول حاليًا بسبب كثرة الطلبات. حاول بعد دقيقة.';
        }

        if (str_contains($haystack, 'timeout') || str_contains($haystack, 'timed out')) {
            return 'انتهت مهلة الاتصال بالمزود الخارجي. حاول مرة أخرى.';
        }

        return 'تعذر تنفيذ الطلب من المزود الخارجي حاليًا. حاول مرة أخرى لاحقًا.';
    }

    protected function getUserStats(User $user): array
    {
        $successfulPayments = $user->payments()->where('status', 1);
        $approvedDeposits = $user->deposits()->where('status', 1);

        $spent = round((float) $successfulPayments->sum('price'), 2);
        $deposited = round((float) $approvedDeposits->sum('amount'), 2);
        $profit = round((float) $successfulPayments->sum('profit_amount'), 2);
        $customerLevel = $this->resolveCustomerLevel($user, $spent);

        return [
            'totalSpent' => $spent,
            'totalDeposited' => $deposited,
            'consumedBalance' => $spent,
            'consumptionRate' => $deposited > 0 ? round(($spent / $deposited) * 100, 2) : 0,
            'successfulOrders' => $successfulPayments->count(),
            'pendingOrders' => $user->payments()->where('status', 0)->count(),
            'depositsCount' => $approvedDeposits->count(),
            'profitFromUser' => $profit,
            'profitRate' => $spent > 0 ? round(($profit / $spent) * 100, 2) : 0,
            'referralBalance' => round((float) $user->referral_balance, 2),
            'totalReferralEarnings' => round((float) $user->total_referral_earnings, 2),
            'referralsCount' => $user->referrals()->count(),
            'customerLevel' => $customerLevel,
            'apiEnabled' => (bool) $user->api_enabled,
            'resellerMarkupPercentage' => round((float) $user->reseller_markup_percentage, 2),
        ];
    }

    protected function resolveCustomerLevel(User $user, float $spent): int
    {
        if ($user->api_enabled) {
            return 4;
        }

        $level4Threshold = (float) Setting::get('levels.level4_threshold', 2500);
        $level3Threshold = (float) Setting::get('levels.level3_threshold', 1000);
        $level2Threshold = (float) Setting::get('levels.level2_threshold', 250);

        if ($spent >= $level4Threshold) {
            return 4;
        }

        if ($spent >= $level3Threshold) {
            return 3;
        }

        if ($spent >= $level2Threshold) {
            return 2;
        }

        return 1;
    }

    protected function syncCustomerLevel(User $user): void
    {
        $spent = (float) $user->payments()->where('status', 1)->sum('price');
        $user->customer_level = $this->resolveCustomerLevel($user, $spent);

        if (! $user->api_enabled) {
            $discount = match ((int) $user->customer_level) {
                4 => (float) Setting::get('levels.level4_discount_percentage', 0),
                3 => (float) Setting::get('levels.level3_discount_percentage', 0),
                2 => (float) Setting::get('levels.level2_discount_percentage', 0),
                default => 0,
            };

            $user->special_price_discount_percentage = $discount;
        }

        $user->save();
    }

    protected function generateReferralCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (User::query()->where('referral_code', $code)->exists());

        return $code;
    }

    protected function generateSupportId(string $prefix): string
    {
        do {
            $value = $prefix . '-' . Str::upper(Str::random(10));
        } while (Payment::query()->where('support_id', $value)->exists() || Deposit::query()->where('support_id', $value)->exists() || ReferralWithdrawal::query()->where('support_id', $value)->exists());

        return $value;
    }
}

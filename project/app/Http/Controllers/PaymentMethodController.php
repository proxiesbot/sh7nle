<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();

        $paymentMethods = PaymentMethod::query()
            ->when($type === 'automatic', fn ($query) => $query->where('is_automatic', true))
            ->when($type === 'manual', fn ($query) => $query->where('is_automatic', false))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('PaymentMethod/Index', [
            'paymentMethods' => $paymentMethods,
            'filters' => [
                'type' => $type,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('PaymentMethod/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);

        $paymentMethod = new PaymentMethod();
        $this->fillPaymentMethod($paymentMethod, $request, $validated);

        return redirect()->route('paymentMethods.index')->with('success', 'تم إنشاء وسيلة الدفع بنجاح.');
    }

    public function edit(PaymentMethod $paymentMethod): Response
    {
        return Inertia::render('PaymentMethod/Edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $this->validatePayload($request, $paymentMethod);

        $this->fillPaymentMethod($paymentMethod, $request, $validated);

        return redirect()->route('paymentMethods.index')->with('success', 'تم تحديث وسيلة الدفع بنجاح.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        if ($paymentMethod->image) {
            FileUtils::deleteImage($paymentMethod->image);
        }

        $paymentMethod->delete();

        return redirect()->route('paymentMethods.index')->with('success', 'تم حذف وسيلة الدفع بنجاح.');
    }

    protected function validatePayload(Request $request, ?PaymentMethod $paymentMethod = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'in:manual,kazawallet,apisyria_syriatel,apisyria_shamcash,syriatel_cash,sham_cash,kazawallet_manual,binance,coinex,faucetpay,cryptopayment,bank_transfer'],
            'account' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'status' => ['required', 'boolean'],
            'isAutomatic' => ['required', 'boolean'],
            'allowManualFallback' => ['required', 'boolean'],
            'requiresPaymentId' => ['required', 'boolean'],
            'requiresImage' => ['required', 'boolean'],
            'availableForReferralWithdrawal' => ['required', 'boolean'],
        ]);

        if ($validated['provider'] === 'kazawallet') {
            $validated['isAutomatic'] = true;
            $validated['allowManualFallback'] = (bool) ($validated['allowManualFallback'] ?? false);
            $validated['requiresPaymentId'] = false;
            $validated['requiresImage'] = false;
        } elseif (in_array($validated['provider'], ['apisyria_syriatel', 'apisyria_shamcash'], true)) {
            $validated['isAutomatic'] = true;
            $validated['allowManualFallback'] = false;
            $validated['requiresPaymentId'] = true;
            $validated['requiresImage'] = false;
        } else {
            $validated['isAutomatic'] = false;
            $validated['allowManualFallback'] = false;
            $validated['requiresPaymentId'] = true;
            $validated['requiresImage'] = true;
        }

        return $validated;
    }

    protected function fillPaymentMethod(PaymentMethod $paymentMethod, Request $request, array $validated): void
    {
        $provider = (string) $validated['provider'];
        $isApiSyria = in_array($provider, ['apisyria_syriatel', 'apisyria_shamcash'], true);
        $isAutomatic = $provider === 'kazawallet' || $isApiSyria ? true : (bool) $validated['isAutomatic'];
        $requiresPaymentId = $provider === 'kazawallet' ? false : ($isApiSyria ? true : (bool) $validated['requiresPaymentId']);
        $requiresImage = $provider === 'kazawallet' || $isApiSyria ? false : (bool) $validated['requiresImage'];
        $allowManualFallback = $provider === 'kazawallet'
            ? (bool) ($validated['allowManualFallback'] ?? false)
            : false;

        $paymentMethod->name = $validated['name'];
        $paymentMethod->provider = $provider;
        $paymentMethod->status = (bool) $validated['status'];
        $paymentMethod->is_automatic = $isAutomatic;
        $paymentMethod->allow_manual_fallback = $allowManualFallback;
        $paymentMethod->requires_payment_id = $requiresPaymentId;
        $paymentMethod->requires_image = $requiresImage;
        $paymentMethod->account = $validated['account'] ?? '';
        $paymentMethod->notes = $validated['notes'] ?? '';
        $paymentMethod->available_for_referral_withdrawal = (bool) ($validated['availableForReferralWithdrawal'] ?? false);
        $paymentMethod->config = [
            'provider' => $provider,
            'is_automatic' => $isAutomatic,
            'allow_manual_fallback' => $allowManualFallback,
            'requires_payment_id' => $requiresPaymentId,
            'requires_image' => $requiresImage,
            'available_for_referral_withdrawal' => (bool) ($validated['availableForReferralWithdrawal'] ?? false),
        ];

        $image = $request->file('image');
        if ($image) {
            if ($paymentMethod->image) {
                FileUtils::deleteImage($paymentMethod->image);
            }

            $paymentMethod->image = Storage::url($image->storePublicly('images/paymentMethod'));
        }

        $paymentMethod->save();
    }
}

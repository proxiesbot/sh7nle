<?php

namespace App\Http\Requests;

use App\Models\PaymentMethod;
use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $paymentMethod = PaymentMethod::query()->find($this->input('paymentMethodId'));

        return [
            'amount' => ['required', 'numeric', 'min:' . max(0.01, (float) Setting::get('payments.minimum_deposit_usd', 1))],
            'paymentMethodId' => ['required', 'integer', 'exists:payment_methods,id'],
            'paymentId' => [Rule::requiredIf((bool) ($paymentMethod?->requires_payment_id)), 'nullable', 'string', 'max:255', 'regex:/^[A-Za-z0-9\-_:]+$/'],
            'paymentImage' => [Rule::requiredIf((bool) ($paymentMethod?->requires_image)), 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

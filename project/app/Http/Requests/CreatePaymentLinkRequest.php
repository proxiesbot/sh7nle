<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePaymentLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'currency' => ['required', 'string', 'in:USD,SYP'],
            'paymentMethodId' => ['required', 'integer', 'exists:payment_methods,id'],
        ];
    }
}

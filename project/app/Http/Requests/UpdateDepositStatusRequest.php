<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepositStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->hasAnyRole(['Super-Admin', 'admin']);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', 'in:0,1,2'],
        ];
    }
}

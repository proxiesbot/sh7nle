<?php

namespace App\Http\Requests;

use App\Models\Card;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BuyCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $cardId = $this->input('card.id');
        $card = $cardId ? Card::query()->find($cardId) : null;

        return [
            'card' => ['required', 'array'],
            'card.id' => ['required', 'integer', 'exists:cards,id'],
            'userId' => [Rule::requiredIf((bool) ($card?->requires_player_id)), 'nullable', 'string', 'max:255'],
            'secondaryUserId' => [Rule::requiredIf((bool) ($card?->requires_secondary_player_id)), 'nullable', 'string', 'max:255'],
            'providerValue' => ['nullable'],
            'amount' => ['required', 'integer', 'min:1', 'max:100000'],
        ];
    }
}

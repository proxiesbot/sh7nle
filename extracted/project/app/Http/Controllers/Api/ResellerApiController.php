<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\UserController;
use App\Http\Requests\BuyCardRequest;
use App\Models\Card;
use App\Models\Payment;
use App\Models\User;
use App\Models\Setting;
use App\Services\Providers\ProviderGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ResellerApiController extends UserController
{
    public function __construct(ProviderGateway $providerGateway)
    {
        parent::__construct($providerGateway);
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'balance' => round((float) $user->balance, 2),
                'level' => $user->customer_level,
                'reseller_markup_percentage' => round((float) $user->reseller_markup_percentage, 2),
            ],
            'pricing' => [
                'global_markup_percentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
            ],
        ]);
    }

    public function products(Request $request)
    {
        $user = $request->user();

        $cards = Card::query()
            ->with('providerSource')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Card $card) use ($user) {
                return [
                    'id' => $card->id,
                    'name' => $card->name,
                    'description' => $card->description,
                    'icon' => $card->icon,
                    'background' => $card->background,
                    'price' => $this->getEffectiveUnitPrice($card, $user),
                    'cost_price' => $this->getEffectiveUnitCost($card),
                    'purchase_flow' => $card->purchase_flow,
                    'requires_player_id' => (bool) $card->requires_player_id,
                    'requires_secondary_player_id' => (bool) $card->requires_secondary_player_id,
                    'player_id_label' => $card->player_id_label,
                    'secondary_player_id_label' => $card->secondary_player_id_label,
                    'quantity_label' => $card->quantity_label,
                    'delivery_mode' => $card->delivery_mode,
                    'provider_qty_values' => $card->provider_qty_values,
                    'option_prices' => $card->option_prices,
                    'option_costs' => $card->option_costs,
                    'provider_source' => $card->providerSource?->only(['id', 'name', 'driver']),
                ];
            });

        return response()->json(['data' => $cards]);
    }

    public function showProduct(Request $request, Card $card)
    {
        abort_if(! $card->is_active, 404);

        return response()->json([
            'data' => [
                'id' => $card->id,
                'name' => $card->name,
                'description' => $card->description,
                'icon' => $card->icon,
                'background' => $card->background,
                'price' => $this->getEffectiveUnitPrice($card, $request->user()),
                'cost_price' => $this->getEffectiveUnitCost($card),
                'purchase_flow' => $card->purchase_flow,
                'requires_player_id' => (bool) $card->requires_player_id,
                'requires_secondary_player_id' => (bool) $card->requires_secondary_player_id,
                'player_id_label' => $card->player_id_label,
                'secondary_player_id_label' => $card->secondary_player_id_label,
                'quantity_label' => $card->quantity_label,
                'delivery_mode' => $card->delivery_mode,
                'provider_qty_values' => $card->provider_qty_values,
                'option_prices' => $card->option_prices,
                'option_costs' => $card->option_costs,
            ],
        ]);
    }

    public function orders(Request $request)
    {
        $payments = $request->user()->payments()->with('card')->latest()->paginate(20);

        return response()->json($payments);
    }

    public function createOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'card_id' => ['required', 'exists:cards,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'user_id' => ['nullable', 'string', 'max:255'],
            'secondary_user_id' => ['nullable', 'string', 'max:255'],
            'provider_value' => ['nullable'],
        ]);

        $validator->validate();

        $user = $request->user();
        $buyRequest = new Request([
            'card' => ['id' => (int) $request->input('card_id')],
            'amount' => (int) $request->input('amount'),
            'userId' => $request->input('user_id'),
            'secondaryUserId' => $request->input('secondary_user_id'),
            'providerValue' => $request->input('provider_value'),
        ]);
        $buyRequest->setUserResolver(fn () => $user);

        $response = $this->buyCard($buyRequest, $user);

        if ($response->getSession()?->get('errors')) {
            return response()->json([
                'message' => $response->getSession()->get('errors')->first(),
            ], 422);
        }

        $latestPayment = $user->payments()->latest()->first();

        return response()->json([
            'message' => 'Order created successfully',
            'payment' => $latestPayment,
        ]);
    }
}

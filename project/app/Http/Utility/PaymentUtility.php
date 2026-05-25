<?php

namespace App\Http\Utility;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\ProviderSource;
use App\Models\User;
use App\Services\Providers\ProviderGateway;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PaymentUtility
{
    public static function getPaymentsStatus(Collection $payments, ?User $user = null): Collection
    {
        $checkablePayments = $payments
            ->filter(function ($payment) {
                return (int) $payment->status === 0 || ((int) $payment->status === 1 && blank($payment->delivered_codes));
            })
            ->values();

        if ($checkablePayments->isNotEmpty()) {
            $checkablePayments = $checkablePayments->map(function ($payment) {
                if (method_exists($payment, 'loadMissing')) {
                    $payment->loadMissing('card.providerSource');
                }

                return $payment;
            })->values();

            $checkablePayments
                ->groupBy(function ($payment) {
                    return $payment->card?->provider_source_id ?: data_get($payment->provider_payload, 'provider_source_id', 'manual');
                })
                ->each(function (Collection $providerPayments, $providerSourceId) {
                    if (! $providerSourceId || $providerSourceId === 'manual') {
                        return;
                    }

                    $providerSource = ProviderSource::query()->find($providerSourceId);
                    if (! $providerSource || ! $providerSource->is_active || blank($providerSource->check_endpoint)) {
                        return;
                    }

                    $gateway = app(ProviderGateway::class);

                    foreach ([false, true] as $useUuid) {
                        $identifiers = $providerPayments
                            ->filter(fn ($payment) => $useUuid ? filled($payment->orderUuid) : filled($payment->orderId))
                            ->pluck($useUuid ? 'orderUuid' : 'orderId')
                            ->filter()
                            ->values();

                        if ($identifiers->isEmpty()) {
                            continue;
                        }

                        try {
                            $responseItems = collect($gateway->check($providerSource, $identifiers->all(), $useUuid));
                        } catch (\Throwable $exception) {
                            continue;
                        }

                        foreach ($responseItems as $responseItem) {
                            $paymentItem = $providerPayments->first(function ($item) use ($responseItem, $useUuid) {
                                $expected = $useUuid
                                    ? ($responseItem['uuid'] ?? $responseItem['order_uuid'] ?? null)
                                    : ($responseItem['order_id'] ?? null);

                                return ($useUuid ? $item->orderUuid : $item->orderId) === $expected;
                            });

                            if (! $paymentItem && ! $useUuid) {
                                $paymentItem = $providerPayments->first(function ($item) use ($responseItem) {
                                    return filled($item->orderUuid)
                                        && $item->orderUuid === ($responseItem['uuid'] ?? $responseItem['order_uuid'] ?? null);
                                });
                            }

                            if (! $paymentItem) {
                                continue;
                            }

                            $deliveryBundle = self::extractDeliveryBundle($responseItem);
                            $oldStatus = (int) $paymentItem->status;
                            $paymentItem->status = self::getStatusFromResponse($responseItem);
                            $paymentItem->provider_status = $responseItem['status'] ?? null;
                            $paymentItem->provider_payload = array_merge((array) $paymentItem->provider_payload, $responseItem);

                            if (filled($deliveryBundle['codes_text'])) {
                                $paymentItem->delivered_codes = $deliveryBundle['codes_text'];
                            }

                            if (! empty($deliveryBundle['details'])) {
                                $paymentItem->delivery_details = $deliveryBundle['details'];
                            }

                            $paymentItem->save();

                            if ($oldStatus !== 1 && (int) $paymentItem->status === 1) {
                                self::applyReferralCommissionIfNeeded($paymentItem);
                            }
                        }
                    }
                });
        }

        $userId = $user?->id ?? $payments->first()?->user_id;
        if ($userId) {
            DB::transaction(function () use ($userId) {
                $lockedUser = User::query()->lockForUpdate()->find($userId);
                if (! $lockedUser) {
                    return;
                }

                $rejectedPayments = $lockedUser->payments()
                    ->where('status', 2)
                    ->whereNull('refunded_at')
                    ->lockForUpdate()
                    ->get();

                $refundTotal = round((float) $rejectedPayments->sum('price'), 2);
                if ($refundTotal > 0) {
                    $lockedUser->balance = round((float) $lockedUser->balance + $refundTotal, 2);
                    $lockedUser->save();

                    $lockedUser->payments()
                        ->whereIn('id', $rejectedPayments->pluck('id'))
                        ->update(['refunded_at' => now()]);
                }
            });
        }

        return $payments->map(function ($payment) {
            return $payment->fresh(['card']);
        });
    }

    public static function applyReferralCommissionIfNeeded(Payment $payment): void
    {
        if ((int) $payment->status !== 1 || $payment->referral_commission_paid_at || (float) $payment->referral_commission_amount <= 0) {
            return;
        }

        DB::transaction(function () use ($payment) {
            $lockedPayment = Payment::query()->lockForUpdate()->with('user.referrer')->find($payment->id);
            if (! $lockedPayment || $lockedPayment->referral_commission_paid_at || (float) $lockedPayment->referral_commission_amount <= 0) {
                return;
            }

            $buyer = $lockedPayment->user;
            $referrer = $buyer?->referrer;
            if (! $referrer) {
                $lockedPayment->referral_commission_paid_at = now();
                $lockedPayment->save();
                return;
            }

            $lockedReferrer = User::query()->lockForUpdate()->findOrFail($referrer->id);
            $lockedReferrer->referral_balance = round((float) $lockedReferrer->referral_balance + (float) $lockedPayment->referral_commission_amount, 2);
            $lockedReferrer->total_referral_earnings = round((float) $lockedReferrer->total_referral_earnings + (float) $lockedPayment->referral_commission_amount, 2);
            $lockedReferrer->save();

            $lockedPayment->referral_commission_paid_at = now();
            $lockedPayment->save();

            Notification::create([
                'title' => 'أرباح إحالة جديدة',
                'message' => 'تمت إضافة عمولة إحالة جديدة إلى رصيدك بقيمة ' . number_format((float) $lockedPayment->referral_commission_amount, 2) . '$.',
                'sender_id' => null,
                'receiver_id' => $lockedReferrer->id,
            ]);
        });
    }

    public static function getStatusFromResponse(array $responseJson): int
    {
        return match ($responseJson['status'] ?? null) {
            'accept' => 1,
            'reject' => 2,
            default => 0,
        };
    }

    public static function extractDeliveryBundle(array $responseJson): array
    {
        $source = [
            'replay_api' => $responseJson['replay_api'] ?? null,
            'data' => $responseJson['data'] ?? null,
        ];

        $codes = [];
        self::collectCodes($source, $codes);
        $codes = collect($codes)
            ->map(fn ($code) => trim((string) $code))
            ->filter(fn ($code) => $code !== '' && ! in_array(strtolower($code), ['accept', 'reject', 'wait'], true))
            ->unique()
            ->values()
            ->all();

        return [
            'codes' => $codes,
            'codes_text' => implode("\n", $codes),
            'details' => $source,
        ];
    }

    protected static function collectCodes(mixed $value, array &$codes, ?string $parentKey = null): void
    {
        if (is_string($value) || is_numeric($value)) {
            if ($parentKey === null || preg_match('/replay|code|pin|serial|voucher/i', $parentKey)) {
                $codes[] = (string) $value;
            }

            return;
        }

        if (! is_array($value)) {
            return;
        }

        foreach ($value as $key => $item) {
            $nextParentKey = is_string($key) ? $key : $parentKey;
            self::collectCodes($item, $codes, $nextParentKey);
        }
    }
}

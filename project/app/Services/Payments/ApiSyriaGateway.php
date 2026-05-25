<?php

namespace App\Services\Payments;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class ApiSyriaGateway
{
    public function __construct(
        protected ?string $apiKey = null,
        protected string $baseUrl = 'https://apisyria.com/api/v1'
    ) {
        $this->apiKey = $this->apiKey ?: config('payments.apisyria.api_key');
    }

    protected function request()
    {
        return Http::baseUrl($this->baseUrl)
            ->acceptJson()
            ->withHeaders([
                'X-Api-Key' => (string) $this->apiKey,
            ])
            ->connectTimeout(20)
            ->timeout(45)
            ->retry(2, 500);
    }

    public function findSyriatelTransaction(string $tx, string $gsm, string $period = '7'): array
    {
        $response = $this->request()->get('', [
            'resource' => 'syriatel',
            'action' => 'find_tx',
            'tx' => $tx,
            'gsm' => $gsm,
            'period' => $period,
        ]);

        return $this->normalizeResponse($response->json(), $response->successful());
    }

    public function findShamCashTransaction(string $tx, string $accountAddress): array
    {
        $response = $this->request()->get('', [
            'resource' => 'shamcash',
            'action' => 'find_tx',
            'tx' => $tx,
            'account_address' => $accountAddress,
        ]);

        return $this->normalizeResponse($response->json(), $response->successful());
    }

    protected function normalizeResponse(mixed $payload, bool $successful): array
    {
        $payload = is_array($payload) ? $payload : [];
        $success = (bool) Arr::get($payload, 'success', $successful);
        $error = trim((string) Arr::get($payload, 'error', ''));

        return [
            'success' => $success,
            'error' => $error,
            'payload' => $payload,
            'data' => (array) Arr::get($payload, 'data', []),
        ];
    }
}

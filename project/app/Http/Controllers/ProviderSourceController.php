<?php

namespace App\Http\Controllers;

use App\Models\ProviderSource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProviderSourceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ProviderSource/Index', [
            'providerSources' => ProviderSource::query()->latest()->paginate(10),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ProviderSource/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);

        ProviderSource::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?: Str::slug($validated['name']),
            'driver' => $validated['driver'],
            'base_url' => $validated['baseUrl'] ?? null,
            'api_token' => $validated['apiToken'] ?? null,
            'auth_header' => $validated['authHeader'] ?? 'api-token',
            'auth_prefix' => $validated['authPrefix'] ?? null,
            'catalog_endpoint' => $validated['catalogEndpoint'] ?? null,
            'product_endpoint' => $validated['productEndpoint'] ?? null,
            'order_endpoint' => $validated['orderEndpoint'] ?? null,
            'check_endpoint' => $validated['checkEndpoint'] ?? null,
            'supports_catalog' => (bool) $validated['supportsCatalog'],
            'is_active' => (bool) $validated['isActive'],
            'config' => $this->parseJson($validated['configJson'] ?? null),
        ]);

        return redirect()->route('providerSources.index')->with('success', 'تمت إضافة المزود بنجاح.');
    }

    public function edit(ProviderSource $providerSource): Response
    {
        return Inertia::render('ProviderSource/Edit', [
            'providerSource' => array_merge($providerSource->toArray(), [
                'api_token' => $providerSource->getRawOriginal('api_token'),
                'config_json' => $providerSource->config ? json_encode($providerSource->config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : '',
            ]),
        ]);
    }

    public function update(Request $request, ProviderSource $providerSource): RedirectResponse
    {
        $validated = $this->validatePayload($request, $providerSource);

        $providerSource->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?: Str::slug($validated['name']),
            'driver' => $validated['driver'],
            'base_url' => $validated['baseUrl'] ?? null,
            'api_token' => $validated['apiToken'] ?? null,
            'auth_header' => $validated['authHeader'] ?? 'api-token',
            'auth_prefix' => $validated['authPrefix'] ?? null,
            'catalog_endpoint' => $validated['catalogEndpoint'] ?? null,
            'product_endpoint' => $validated['productEndpoint'] ?? null,
            'order_endpoint' => $validated['orderEndpoint'] ?? null,
            'check_endpoint' => $validated['checkEndpoint'] ?? null,
            'supports_catalog' => (bool) $validated['supportsCatalog'],
            'is_active' => (bool) $validated['isActive'],
            'config' => $this->parseJson($validated['configJson'] ?? null),
        ]);

        return redirect()->route('providerSources.index')->with('success', 'تم تحديث المزود بنجاح.');
    }

    public function destroy(ProviderSource $providerSource): RedirectResponse
    {
        $providerSource->delete();

        return redirect()->route('providerSources.index')->with('success', 'تم حذف المزود.');
    }

    protected function validatePayload(Request $request, ?ProviderSource $providerSource = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:provider_sources,slug,' . ($providerSource?->id ?? 'NULL')],
            'driver' => ['required', 'string', 'in:sawa,generic,swgames'],
            'baseUrl' => ['nullable', 'string', 'max:500'],
            'apiToken' => ['nullable', 'string'],
            'authHeader' => ['nullable', 'string', 'max:100'],
            'authPrefix' => ['nullable', 'string', 'max:100'],
            'catalogEndpoint' => ['nullable', 'string', 'max:500'],
            'productEndpoint' => ['required', 'string', 'max:500'],
            'orderEndpoint' => ['nullable', 'string', 'max:500'],
            'checkEndpoint' => ['nullable', 'string', 'max:500'],
            'supportsCatalog' => ['required', 'boolean'],
            'isActive' => ['required', 'boolean'],
            'configJson' => ['nullable', 'string'],
        ]);
    }

    protected function parseJson(?string $value): ?array
    {
        if (! $value) {
            return null;
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : null;
    }
}

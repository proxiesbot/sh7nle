<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\ImportedProviderProduct;
use App\Models\ProviderSource;
use App\Models\Section;
use App\Services\Providers\ProviderGateway;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ImportedProviderProductController extends Controller
{
    public function __construct(protected ProviderGateway $providerGateway)
    {
    }

    protected function providerImportError(?ProviderSource $providerSource): ?string
    {
        if (! $providerSource) {
            return 'المزود غير موجود أو غير مفعّل.';
        }

        if (! $providerSource->is_active) {
            return 'المزود غير مفعّل من لوحة الإدارة.';
        }

        if (! $providerSource->supports_catalog) {
            return 'هذا المزود لا يدعم استيراد الكتالوج.';
        }

        if (blank($providerSource->base_url)) {
            return 'رابط API الأساسي للمزود غير مضبوط.';
        }

        if (blank($providerSource->api_token)) {
            return 'توكن API للمزود غير مضبوط. ضع التوكن من صفحة تعديل المزود ثم جرّب الاستيراد.';
        }

        return null;
    }

    protected function failJsonOrRedirect(Request $request, string $message)
    {
        if ($request->expectsJson() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json(['message' => $message], 422);
        }

        return redirect()->back()->with('error', $message);
    }

    public function index(Request $request): Response
    {
        $filters = [
            'search' => (string) $request->string('search'),
            'providerSourceId' => $request->integer('providerSourceId') ?: null,
            'sectionId' => $request->integer('sectionId') ?: null,
            'root' => $request->boolean('root'),
            'remoteParentId' => $request->integer('remoteParentId') ?: 0,
            'trail' => collect($request->input('trail', []))
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->values()
                ->all(),
            'parentStack' => collect($request->input('parentStack', []))
                ->map(fn ($item) => (int) $item)
                ->filter(fn ($item) => $item >= 0)
                ->values()
                ->all(),
        ];

        $query = ImportedProviderProduct::query()->with('providerSource')->latest('updated_at');

        if ($filters['providerSourceId']) {
            $query->where('provider_source_id', $filters['providerSourceId']);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('remote_id', 'like', "%{$search}%")
                    ->orWhere('category_path', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->paginate(20)->through(function (ImportedProviderProduct $product) {
            return [
                'id' => $product->id,
                'providerSourceId' => $product->provider_source_id,
                'providerName' => $product->providerSource?->name,
                'remoteId' => $product->remote_id,
                'remoteParentId' => $product->remote_parent_id,
                'categoryPath' => $product->category_path,
                'name' => $product->name,
                'description' => $product->description,
                'image' => $product->image,
                'providerProductType' => $product->provider_product_type,
                'price' => $product->price,
                'basePrice' => $product->base_price,
                'costPrice' => $product->cost_price,
                'providerCostPrice' => $product->provider_cost_price,
                'available' => $product->available,
                'requiresPlayerId' => $product->requires_player_id,
                'requiresSecondaryPlayerId' => $product->requires_secondary_player_id,
                'playerIdLabel' => $product->player_id_label,
                'secondaryPlayerIdLabel' => $product->secondary_player_id_label,
                'quantityLabel' => $product->quantity_label,
                'amountMode' => $product->amount_mode,
                'deliveryMode' => $product->delivery_mode,
                'purchaseFlow' => $product->purchase_flow,
                'minAmount' => $product->min_amount,
                'maxAmount' => $product->max_amount,
                'providerQtyValues' => $product->provider_qty_values,
                'providerParams' => $product->provider_params,
                'updatedAt' => optional($product->updated_at)->toDateTimeString(),
            ];
        })->withQueryString();

        $providerSources = ProviderSource::query()->orderBy('name')->get(['id', 'name', 'driver', 'supports_catalog', 'is_active']);
        $selectedProvider = $filters['providerSourceId']
            ? ProviderSource::query()->where('is_active', true)->find($filters['providerSourceId'])
            : null;

        $remoteCatalog = null;
        if ($selectedProvider && $selectedProvider->supports_catalog) {
            try {
                $catalog = $this->providerGateway->catalog($selectedProvider, $filters['remoteParentId']);
                $remoteProducts = collect((array) ($catalog['products'] ?? []))->values();
                $existingRemoteIds = Card::query()
                    ->where('provider_source_id', $selectedProvider->id)
                    ->whereIn('provider_product_id', $remoteProducts->pluck('id')->map(fn ($id) => (string) $id)->all())
                    ->pluck('provider_product_id')
                    ->map(fn ($id) => (string) $id)
                    ->all();

                $remoteCatalog = [
                    'provider' => [
                        'id' => $selectedProvider->id,
                        'name' => $selectedProvider->name,
                        'driver' => $selectedProvider->driver,
                        'slug' => $selectedProvider->slug,
                    ],
                    'currentParentId' => (int) ($catalog['parentId'] ?? $filters['remoteParentId']),
                    'trail' => $filters['trail'],
                    'parentStack' => $filters['parentStack'],
                    'categories' => collect((array) ($catalog['categories'] ?? []))
                        ->map(fn ($category) => [
                            'id' => (int) ($category['id'] ?? 0),
                            'name' => (string) ($category['name'] ?? 'قسم'),
                            'parentId' => (int) ($category['parentId'] ?? $filters['remoteParentId']),
                            'image' => $category['image'] ?? null,
                        ])
                        ->filter(fn ($category) => $category['id'] > 0)
                        ->values()
                        ->all(),
                    'products' => $remoteProducts
                        ->map(fn ($product) => [
                            'id' => (string) ($product['id'] ?? ''),
                            'name' => (string) ($product['name'] ?? 'منتج'),
                            'categoryName' => $product['categoryName'] ?? null,
                            'description' => $product['description'] ?? null,
                            'image' => $product['image'] ?? null,
                            'price' => (float) ($product['price'] ?? 0),
                            'basePrice' => (float) ($product['basePrice'] ?? $product['price'] ?? 0),
                            'costPrice' => (float) ($product['costPrice'] ?? $product['basePrice'] ?? $product['price'] ?? 0),
                            'providerProductType' => $product['providerProductType'] ?? $product['productType'] ?? 'package',
                            'deliveryMode' => $product['deliveryMode'] ?? 'manual_review',
                            'requiresPlayerId' => (bool) ($product['requiresPlayerId'] ?? false),
                            'requiresSecondaryPlayerId' => (bool) ($product['requiresSecondaryPlayerId'] ?? false),
                            'available' => (bool) ($product['available'] ?? true),
                            'purchaseFlow' => $product['purchaseFlow'] ?? 'direct_purchase',
                            'providerQtyValues' => $product['providerQtyValues'] ?? [],
                            'providerParams' => $product['providerParams'] ?? [],
                            'isImported' => in_array((string) ($product['id'] ?? ''), $existingRemoteIds, true),
                        ])
                        ->filter(fn ($product) => $product['id'] !== '')
                        ->values()
                        ->all(),
                ];
            } catch (\Throwable $exception) {
                report($exception);
                $message = trim((string) $exception->getMessage());
                $remoteCatalog = [
                    'provider' => ['id' => $selectedProvider->id, 'name' => $selectedProvider->name],
                    'currentParentId' => $filters['remoteParentId'],
                    'trail' => $filters['trail'],
                    'parentStack' => $filters['parentStack'],
                    'categories' => [],
                    'products' => [],
                    'error' => 'تعذر قراءة أقسام ومنتجات هذا المزود الآن. ' . ($message !== '' ? $message : 'جرّب مرة ثانية.'),
                ];
            }
        }

        $targetSection = $filters['sectionId'] ? Section::query()->find($filters['sectionId']) : null;

        return Inertia::render('ImportedProviderProduct/Index', [
            'products' => $products,
            'providerSources' => $providerSources,
            'filters' => $filters,
            'targetSection' => $targetSection,
            'importSections' => $this->importSectionOptions(),
            'remoteCatalog' => $remoteCatalog,
        ]);
    }


    protected function importSectionOptions(): array
    {
        $sections = Section::query()
            ->orderBy('section_id')
            ->orderBy('name')
            ->get(['id', 'name', 'section_id']);

        $children = $sections->groupBy('section_id');
        $result = [];

        $walk = function ($parentId, $prefix = '') use (&$walk, $children, &$result) {
            foreach (($children[$parentId] ?? collect()) as $section) {
                $label = $prefix . $section->name;
                $result[] = [
                    'id' => $section->id,
                    'name' => $section->name,
                    'label' => $label,
                    'parentId' => $section->section_id,
                ];

                $walk($section->id, $label . ' / ');
            }
        };

        $walk(0);

        return $result;
    }


    public function sync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
            'remoteParentId' => ['nullable', 'integer'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
            'parentStack' => ['nullable', 'array'],
            'parentStack.*' => ['integer'],
        ]);

        return redirect()->route('importedProducts.index', Arr::only($validated, ['providerSourceId', 'sectionId', 'root', 'remoteParentId', 'trail', 'parentStack']));
    }

    public function importRemote(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'productId' => ['required', 'string'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
            'remoteParentId' => ['nullable', 'integer'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
        ]);

        $providerSource = ProviderSource::query()->where('is_active', true)->findOrFail($validated['providerSourceId']);
        if ($message = $this->providerImportError($providerSource)) {
            return redirect()->back()->with('error', $message);
        }

        try {
            $preview = $this->providerGateway->preview($providerSource, (string) $validated['productId']);
            $trail = $this->normalizeTrail($validated['trail'] ?? [], $preview['normalized']['categoryName'] ?? null);
            $imported = $this->upsertImportedProduct($providerSource, $preview['normalized'], $preview['raw'], $trail, (int) ($validated['remoteParentId'] ?? 0));
            $result = $this->publishImportedProduct($imported, $validated);
        } catch (\Throwable $exception) {
            return redirect()->back()->with('error', 'تعذر استيراد هذا المنتج من المزود.');
        }

        return redirect()->back()->with($result['status'], $result['message']);
    }


    public function startAllProvidersImport(Request $request)
    {
        $validated = $request->validate([
            'providerSourceIds' => ['nullable', 'array'],
            'providerSourceIds.*' => ['integer', 'exists:provider_sources,id'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
        ]);

        $allProviders = ProviderSource::query()
            ->where('is_active', true)
            ->where('supports_catalog', true)
            ->when(!empty($validated['providerSourceIds'] ?? []), fn ($query) => $query->whereIn('id', $validated['providerSourceIds']))
            ->orderBy('name')
            ->get();

        $providerWarnings = [];
        $providers = $allProviders->filter(function (ProviderSource $provider) use (&$providerWarnings) {
            $message = $this->providerImportError($provider);
            if ($message) {
                $providerWarnings[] = $provider->name . ': ' . $message;
                return false;
            }

            return true;
        })->values();

        if ($providers->isEmpty()) {
            $message = 'لا يوجد مزودات جاهزة للاستيراد. ' . implode(' | ', $providerWarnings);
            return response()->json(['message' => trim($message)], 422);
        }

        $jobId = (string) Str::uuid();
        $providerQueue = $providers->map(fn ($provider) => [
            'id' => $provider->id,
            'name' => $provider->name,
            'driver' => $provider->driver,
            'done' => false,
            'started' => false,
            'progress' => null,
        ])->values()->all();

        $state = [
            'jobId' => $jobId,
            'status' => 'running',
            'stage' => 'starting',
            'mode' => 'all_providers',
            'sectionId' => isset($validated['sectionId']) ? (int) $validated['sectionId'] : null,
            'root' => !empty($validated['root']),
            'providers' => $providerQueue,
            'activeProviderIndex' => 0,
            'activeState' => null,
            'totalProviders' => $providers->count(),
            'completedProviders' => 0,
            'totalProducts' => 0,
            'discoveredProducts' => 0,
            'processedProducts' => 0,
            'importedProducts' => 0,
            'addedCards' => 0,
            'existingCards' => 0,
            'failedProducts' => 0,
            'currentItem' => null,
            'lastMessage' => 'تم إنشاء مهمة الاستيراد الشامل…',
            'warnings' => $providerWarnings,
            'error' => null,
        ];

        $this->putImportState($request, $jobId, $state);

        return response()->json([
            'jobId' => $jobId,
            'status' => $state['status'],
            'stage' => $state['stage'],
            'progress' => $this->formatAllProvidersProgress($state),
        ]);
    }

    public function processAllProvidersImport(Request $request)
    {
        $validated = $request->validate([
            'jobId' => ['required', 'string'],
        ]);

        $state = $this->getImportState($request, $validated['jobId']);
        if (!is_array($state)) {
            return response()->json(['message' => 'انتهت جلسة الاستيراد الشامل أو لم تعد موجودة.'], 404);
        }

        if (($state['status'] ?? null) !== 'running') {
            return response()->json([
                'jobId' => $validated['jobId'],
                'status' => $state['status'] ?? 'failed',
                'stage' => $state['stage'] ?? 'idle',
                'progress' => $this->formatAllProvidersProgress($state),
            ]);
        }

        try {
            $state = $this->processNextAllProvidersStep($state);
        } catch (\Throwable $exception) {
            report($exception);
            $state['status'] = 'failed';
            $state['error'] = trim((string) $exception->getMessage()) ?: 'تعذر إكمال الاستيراد الشامل.';
            $state['lastMessage'] = $state['error'];
        }

        $this->putImportState($request, $validated['jobId'], $state);

        return response()->json([
            'jobId' => $validated['jobId'],
            'status' => $state['status'],
            'stage' => $state['stage'] ?? 'idle',
            'progress' => $this->formatAllProvidersProgress($state),
        ]);
    }

    protected function processNextAllProvidersStep(array $state): array
    {
        $providers = array_values((array) ($state['providers'] ?? []));
        $index = (int) ($state['activeProviderIndex'] ?? 0);

        if ($index >= count($providers)) {
            $state['status'] = 'completed';
            $state['stage'] = 'completed';
            $state['currentItem'] = null;
            $state['lastMessage'] = 'اكتمل الاستيراد الشامل لكل المزودات.';
            return $state;
        }

        $providerInfo = $providers[$index] ?? null;
        if (!$providerInfo) {
            $state['activeProviderIndex'] = $index + 1;
            return $state;
        }

        $providerSource = ProviderSource::query()->where('is_active', true)->find((int) ($providerInfo['id'] ?? 0));
        if (!$providerSource) {
            $providers[$index]['done'] = true;
            $providers[$index]['error'] = 'المزود غير متاح.';
            $state['providers'] = $providers;
            $state['activeProviderIndex'] = $index + 1;
            $state['completedProviders'] = (int) ($state['completedProviders'] ?? 0) + 1;
            return $state;
        }

        if (empty($state['activeState'])) {
            $providers[$index]['started'] = true;
            $state['providers'] = $providers;
            $state['activeState'] = [
                'providerSourceId' => $providerSource->id,
                'remoteParentId' => 0,
                'sectionId' => $state['sectionId'] ?? null,
                'root' => !empty($state['root']),
                'trail' => [],
                'status' => 'running',
                'stage' => 'scanning',
                'pendingCategories' => [[
                    'parentId' => 0,
                    'trail' => [],
                ]],
                'pendingProducts' => [],
                'visited' => [],
                'queuedProductKeys' => [],
                'processedProductKeys' => [],
                'scannedCategories' => 0,
                'maxScannedCategories' => 1500,
                'maxDiscoveredProducts' => 8000,
                'totalProducts' => 0,
                'discoveredProducts' => 0,
                'processedProducts' => 0,
                'importedProducts' => 0,
                'addedCards' => 0,
                'existingCards' => 0,
                'failedProducts' => 0,
                'currentItem' => null,
                'error' => null,
                'lastMessage' => 'بدء استيراد مزود: ' . $providerSource->name,
            ];
            $state['stage'] = 'provider_start';
            $state['lastMessage'] = 'بدأ استيراد مزود: ' . $providerSource->name;
            return $state;
        }

        $before = (array) $state['activeState'];
        $after = $this->processNextImportStep($providerSource, $before);
        $state['activeState'] = $after;

        $state['currentItem'] = '[' . $providerSource->name . '] ' . ($after['currentItem'] ?? '');
        $state['lastMessage'] = '[' . $providerSource->name . '] ' . ($after['lastMessage'] ?? '');
        $state['stage'] = $after['stage'] ?? 'running';

        $providers[$index]['progress'] = $this->formatImportProgress($after);
        $state['providers'] = $providers;

        if (($after['status'] ?? null) === 'completed') {
            $state['totalProducts'] = (int) ($state['totalProducts'] ?? 0) + (int) ($after['totalProducts'] ?? 0);
            $state['discoveredProducts'] = (int) ($state['discoveredProducts'] ?? 0) + (int) ($after['discoveredProducts'] ?? $after['totalProducts'] ?? 0);
            $state['processedProducts'] = (int) ($state['processedProducts'] ?? 0) + (int) ($after['processedProducts'] ?? 0);
            $state['importedProducts'] = (int) ($state['importedProducts'] ?? 0) + (int) ($after['importedProducts'] ?? 0);
            $state['addedCards'] = (int) ($state['addedCards'] ?? 0) + (int) ($after['addedCards'] ?? 0);
            $state['existingCards'] = (int) ($state['existingCards'] ?? 0) + (int) ($after['existingCards'] ?? 0);
            $state['failedProducts'] = (int) ($state['failedProducts'] ?? 0) + (int) ($after['failedProducts'] ?? 0);

            $providers[$index]['done'] = true;
            $providers[$index]['progress'] = $this->formatImportProgress($after);
            $state['providers'] = $providers;
            $state['activeState'] = null;
            $state['activeProviderIndex'] = $index + 1;
            $state['completedProviders'] = (int) ($state['completedProviders'] ?? 0) + 1;
            $state['stage'] = 'provider_completed';
            $state['lastMessage'] = 'اكتمل مزود: ' . $providerSource->name;
        }

        if (($state['activeProviderIndex'] ?? 0) >= count($providers)) {
            $state['status'] = 'completed';
            $state['stage'] = 'completed';
            $state['lastMessage'] = 'اكتمل الاستيراد الشامل لكل المزودات.';
        }

        return $state;
    }

    protected function formatAllProvidersProgress(array $state): array
    {
        $active = is_array($state['activeState'] ?? null) ? $this->formatImportProgress($state['activeState']) : null;
        $baseDiscovered = (int) ($state['discoveredProducts'] ?? $state['totalProducts'] ?? 0);
        $baseProcessed = (int) ($state['processedProducts'] ?? 0);
        $activeDiscovered = (int) ($active['discoveredProducts'] ?? $active['totalProducts'] ?? 0);
        $activeProcessed = (int) ($active['processedProducts'] ?? 0);
        $discovered = $baseDiscovered + $activeDiscovered;
        $processed = $baseProcessed + $activeProcessed;
        $percentage = $discovered > 0 ? min(100, (int) floor(($processed / $discovered) * 100)) : 0;

        return [
            'mode' => 'all_providers',
            'totalProviders' => (int) ($state['totalProviders'] ?? count((array) ($state['providers'] ?? []))),
            'completedProviders' => (int) ($state['completedProviders'] ?? 0),
            'activeProviderIndex' => (int) ($state['activeProviderIndex'] ?? 0),
            'providers' => $state['providers'] ?? [],
            'activeProvider' => ($state['providers'][$state['activeProviderIndex'] ?? 0] ?? null),
            'active' => $active,
            'totalProducts' => $discovered,
            'discoveredProducts' => $discovered,
            'processedProducts' => $processed,
            'importedProducts' => (int) ($state['importedProducts'] ?? 0) + (int) ($state['activeState']['importedProducts'] ?? 0),
            'addedCards' => (int) ($state['addedCards'] ?? 0) + (int) ($state['activeState']['addedCards'] ?? 0),
            'existingCards' => (int) ($state['existingCards'] ?? 0) + (int) ($state['activeState']['existingCards'] ?? 0),
            'failedProducts' => (int) ($state['failedProducts'] ?? 0) + (int) ($state['activeState']['failedProducts'] ?? 0),
            'pendingCategories' => (int) ($state['activeState'] ? count((array) ($state['activeState']['pendingCategories'] ?? [])) : 0),
            'pendingProducts' => (int) ($state['activeState'] ? count((array) ($state['activeState']['pendingProducts'] ?? [])) : 0),
            'currentItem' => $state['currentItem'] ?? null,
            'lastMessage' => $state['lastMessage'] ?? null,
            'error' => $state['error'] ?? null,
            'warnings' => $state['warnings'] ?? [],
            'percentage' => $percentage,
            'display' => $discovered > 0 ? ('مستورد ' . $processed . ' / مكتشف ' . $discovered) : 'بانتظار الاكتشاف',
        ];
    }



    public function importSelectedRemoteProducts(Request $request)
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'productIds' => ['required', 'array', 'min:1', 'max:200'],
            'productIds.*' => ['required', 'string', 'max:255'],
            'remoteParentId' => ['nullable', 'integer'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
        ]);

        $providerSource = ProviderSource::query()->where('is_active', true)->findOrFail($validated['providerSourceId']);
        if ($message = $this->providerImportError($providerSource)) {
            return response()->json(['message' => $message], 422);
        }

        $requestedIds = collect($validated['productIds'])->map(fn ($id) => trim((string) $id))->filter()->unique()->values();

        $stats = [
            'requested' => $requestedIds->count(),
            'imported' => 0,
            'addedCards' => 0,
            'existingCards' => 0,
            'failed' => 0,
            'messages' => [],
        ];

        try {
            $catalog = $this->providerGateway->catalog($providerSource, (int) ($validated['remoteParentId'] ?? 0));
            $productsById = collect((array) ($catalog['products'] ?? []))
                ->filter(fn ($entry) => is_array($entry) && trim((string) ($entry['id'] ?? '')) !== '')
                ->keyBy(fn ($entry) => (string) $entry['id']);

            foreach ($requestedIds as $productId) {
                try {
                    $normalizedProduct = (array) ($productsById[$productId] ?? ['id' => $productId]);
                    $rawProduct = $normalizedProduct;

                    if (
                        empty($normalizedProduct['price']) ||
                        empty($normalizedProduct['costPrice']) ||
                        empty($normalizedProduct['providerCostPrice']) ||
                        empty($normalizedProduct['name'])
                    ) {
                        $preview = $this->providerGateway->preview($providerSource, $productId);
                        $normalizedProduct = (array) ($preview['normalized'] ?? $normalizedProduct);
                        $rawProduct = (array) ($preview['raw'] ?? $rawProduct);
                    }

                    $productTrail = $this->normalizeProductTrail(
                        $this->normalizeTrail($validated['trail'] ?? []),
                        $normalizedProduct,
                        $rawProduct
                    );

                    $imported = $this->upsertImportedProduct(
                        $providerSource,
                        $normalizedProduct,
                        $rawProduct,
                        $productTrail,
                        (int) ($validated['remoteParentId'] ?? 0)
                    );

                    $result = $this->publishImportedProduct($imported, [
                        'rootSectionId' => $validated['sectionId'] ?? null,
                        'root' => !empty($validated['root']),
                    ]);

                    $stats['imported']++;
                    if (($result['created'] ?? false) === true) {
                        $stats['addedCards']++;
                    } elseif (($result['updated'] ?? false) === true) {
                        $stats['existingCards']++;
                    }
                } catch (\Throwable $exception) {
                    report($exception);
                    $stats['failed']++;
                    $stats['messages'][] = $productId . ': ' . (trim((string) $exception->getMessage()) ?: 'فشل الاستيراد');
                }
            }
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json([
                'message' => 'تعذر استيراد المنتجات المحددة. ' . trim((string) $exception->getMessage()),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => "تم استيراد {$stats['imported']} من {$stats['requested']} منتج. أضيف {$stats['addedCards']} وتم تحديث {$stats['existingCards']} وفشل {$stats['failed']}.",
            'stats' => $stats,
        ]);
    }


    public function importRemoteCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'remoteParentId' => ['nullable', 'integer'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
        ]);

        $providerSource = ProviderSource::query()->where('is_active', true)->findOrFail($validated['providerSourceId']);
        if ($message = $this->providerImportError($providerSource)) {
            return redirect()->back()->with('error', $message);
        }

        $stats = [
            'imported_products' => 0,
            'added_cards' => 0,
            'existing_cards' => 0,
            'failed' => 0,
            'visited' => [],
        ];

        try {
            $this->importCategoryRecursively(
                $providerSource,
                (int) ($validated['remoteParentId'] ?? 0),
                $this->normalizeTrail($validated['trail'] ?? []),
                $validated,
                $stats
            );
        } catch (\Throwable $exception) {
            report($exception);
            return redirect()->back()->with('error', 'تعذر استيراد هذا القسم كاملًا. ' . trim((string) $exception->getMessage()));
        }

        $message = "تمت مزامنة {$stats['imported_products']} منتج من هذا القسم، أُضيف {$stats['added_cards']} للمتجر";
        if ($stats['existing_cards'] > 0) {
            $message .= "، وتم تحديث {$stats['existing_cards']} منتج موجود مسبقًا";
        }
        if ($stats['failed'] > 0) {
            $message .= "، وفشل {$stats['failed']} منتج";
        }
        $message .= '.';

        return redirect()->back()->with(($stats['added_cards'] > 0 || $stats['existing_cards'] > 0) ? 'success' : 'warning', $message);
    }


    public function startCategoryScan(Request $request)
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'remoteParentId' => ['nullable', 'integer'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
        ]);

        $providerSource = ProviderSource::query()
            ->where('is_active', true)
            ->where('supports_catalog', true)
            ->find((int) $validated['providerSourceId']);

        if ($message = $this->providerImportError($providerSource)) {
            return response()->json(['message' => $message], 422);
        }

        $remoteParentId = (int) ($validated['remoteParentId'] ?? 0);
        $trail = $this->normalizeTrail((array) ($validated['trail'] ?? []));
        $jobId = (string) Str::uuid();

        $state = [
            'jobId' => $jobId,
            'status' => 'running',
            'stage' => 'scan_starting',
            'mode' => 'scan_preview',
            'providerSourceId' => $providerSource->id,
            'providerName' => $providerSource->name,
            'remoteParentId' => $remoteParentId,
            'rootTrail' => $trail,
            'pendingCategories' => [[
                'parentId' => $remoteParentId,
                'trail' => $trail,
                'depth' => 0,
            ]],
            'visited' => [],
            'scannedCategories' => 0,
            'discoveredCategories' => 0,
            'discoveredProducts' => 0,
            'leafProductCandidates' => 0,
            'unavailableProducts' => 0,
            'playerIdProducts' => 0,
            'amountProducts' => 0,
            'packageProducts' => 0,
            'duplicateProducts' => 0,
            'maxScannedCategories' => 700,
            'maxDiscoveredProducts' => 12000,
            'categorySamples' => [],
            'productSamples' => [],
            'warnings' => [],
            'currentItem' => null,
            'lastMessage' => 'تم إنشاء فحص القسم. لن يتم استيراد أي منتج قبل موافقتك.',
            'error' => null,
        ];

        $this->putImportState($request, $jobId, $state);

        return response()->json([
            'jobId' => $jobId,
            'status' => $state['status'],
            'stage' => $state['stage'],
            'progress' => $this->formatScanProgress($state),
        ]);
    }

    public function processCategoryScan(Request $request)
    {
        $validated = $request->validate([
            'jobId' => ['required', 'string'],
        ]);

        $state = $this->getImportState($request, $validated['jobId']);
        if (! is_array($state)) {
            return response()->json(['message' => 'انتهت جلسة فحص القسم أو لم تعد موجودة.'], 404);
        }

        if (($state['status'] ?? null) !== 'running') {
            return response()->json([
                'jobId' => $validated['jobId'],
                'status' => $state['status'] ?? 'failed',
                'stage' => $state['stage'] ?? 'idle',
                'progress' => $this->formatScanProgress($state),
            ]);
        }

        $providerSource = ProviderSource::query()
            ->where('is_active', true)
            ->where('supports_catalog', true)
            ->find((int) ($state['providerSourceId'] ?? 0));

        if (! $providerSource) {
            $state['status'] = 'failed';
            $state['stage'] = 'provider_missing';
            $state['error'] = 'المزود غير متاح أو غير مفعّل.';
            $state['lastMessage'] = $state['error'];
        } else {
            try {
                $state = $this->processNextScanStep($providerSource, $state);
            } catch (\Throwable $exception) {
                report($exception);
                if ($this->isProviderRateLimitException($exception)) {
                    $state = $this->pauseImportForProviderRateLimit($state, $providerSource, $exception);
                    $state['lastMessage'] = 'تم إيقاف الفحص مؤقتًا بسبب حد طلبات المزود. لا تضغط الزر مرة ثانية، وسيكمل لاحقًا.';
                } else {
                    $state['status'] = 'failed';
                    $state['stage'] = 'failed';
                    $state['error'] = trim((string) $exception->getMessage()) ?: 'تعذر إكمال فحص القسم.';
                    $state['lastMessage'] = $state['error'];
                }
            }
        }

        $this->putImportState($request, $validated['jobId'], $state);

        return response()->json([
            'jobId' => $validated['jobId'],
            'status' => $state['status'],
            'stage' => $state['stage'] ?? 'idle',
            'progress' => $this->formatScanProgress($state),
        ]);
    }

    protected function processNextScanStep(ProviderSource $providerSource, array $state): array
    {
        if (!empty($state['pauseUntil'])) {
            $pauseUntil = (int) $state['pauseUntil'];
            if ($pauseUntil > time()) {
                $remaining = max(1, $pauseUntil - time());
                $state['stage'] = 'provider_rate_limited';
                $state['currentItem'] = 'انتظار حد طلبات المزود';
                $state['lastMessage'] = 'تم إيقاف الفحص مؤقتًا بسبب حد طلبات المزود. سيتم المحاولة بعد حوالي ' . ceil($remaining / 60) . ' دقيقة.';
                return $state;
            }

            unset($state['pauseUntil'], $state['rateLimitProviderId']);
            $state['stage'] = 'resuming_scan';
            $state['lastMessage'] = 'انتهت مهلة الانتظار، سيتم متابعة فحص القسم الآن.';
        }

        if (empty($state['pendingCategories'])) {
            $state['status'] = 'completed';
            $state['stage'] = 'scan_completed';
            $state['currentItem'] = null;
            $state['lastMessage'] = 'اكتمل فحص القسم. راجع الأعداد ثم اضغط استيراد القسم إذا كانت صحيحة.';
            return $state;
        }

        $category = array_shift($state['pendingCategories']);
        $parentId = (int) ($category['parentId'] ?? 0);
        $trail = $this->normalizeTrail((array) ($category['trail'] ?? []));
        $visitKey = $parentId . '|' . implode('>', $trail);

        if (in_array($visitKey, (array) ($state['visited'] ?? []), true)) {
            return $this->processNextScanStep($providerSource, $state);
        }

        $state['visited'][] = $visitKey;
        $state['scannedCategories'] = (int) ($state['scannedCategories'] ?? 0) + 1;
        $state['stage'] = 'scanning_category';
        $state['currentItem'] = $trail ? implode(' / ', $trail) : 'القسم الرئيسي';
        $state['lastMessage'] = 'جارٍ فحص: ' . $state['currentItem'];

        if ((int) ($state['scannedCategories'] ?? 0) > (int) ($state['maxScannedCategories'] ?? 700)) {
            $state['status'] = 'completed';
            $state['stage'] = 'scan_completed_with_limit';
            $state['warnings'][] = 'تم إيقاف الفحص عند حد الحماية للأقسام. يمكنك فحص قسم أصغر للحصول على أرقام أدق.';
            $state['lastMessage'] = end($state['warnings']);
            return $state;
        }

        try {
            $catalog = $this->catalogWithRetry($providerSource, $parentId);
        } catch (\Throwable $exception) {
            if ($this->isProviderRateLimitException($exception)) {
                return $this->pauseImportForProviderRateLimit($state, $providerSource, $exception);
            }
            throw $exception;
        }

        $categories = collect((array) ($catalog['categories'] ?? []))
            ->filter(fn ($entry) => is_array($entry) && (int) ($entry['id'] ?? 0) > 0)
            ->unique(fn ($entry) => (string) ($entry['id'] ?? ''))
            ->values();

        $products = collect((array) ($catalog['products'] ?? []))
            ->filter(fn ($entry) => is_array($entry) && trim((string) ($entry['id'] ?? '')) !== '')
            ->unique(fn ($entry) => (string) ($entry['id'] ?? ''))
            ->values();

        $state['discoveredCategories'] = (int) ($state['discoveredCategories'] ?? 0) + $categories->count();
        $state['discoveredProducts'] = (int) ($state['discoveredProducts'] ?? 0) + $products->count();

        foreach ($products as $product) {
            if (count((array) ($state['productSamples'] ?? [])) < 12) {
                $state['productSamples'][] = [
                    'id' => (string) ($product['id'] ?? ''),
                    'name' => (string) ($product['name'] ?? 'منتج'),
                    'path' => implode(' / ', $trail),
                ];
            }

            if (empty($product['available']) && array_key_exists('available', $product)) {
                $state['unavailableProducts'] = (int) ($state['unavailableProducts'] ?? 0) + 1;
            }
            if (!empty($product['requiresPlayerId'])) {
                $state['playerIdProducts'] = (int) ($state['playerIdProducts'] ?? 0) + 1;
            }

            $type = (string) ($product['providerProductType'] ?? $product['productType'] ?? '');
            $flow = (string) ($product['purchaseFlow'] ?? '');
            if ($type === 'amount' || str_contains($flow, 'custom_value')) {
                $state['amountProducts'] = (int) ($state['amountProducts'] ?? 0) + 1;
            } else {
                $state['packageProducts'] = (int) ($state['packageProducts'] ?? 0) + 1;
            }
        }

        $queuedKeys = collect((array) ($state['pendingCategories'] ?? []))
            ->map(fn ($item) => ((int) ($item['parentId'] ?? 0)) . '|' . implode('>', $this->normalizeTrail((array) ($item['trail'] ?? []))))
            ->all();

        foreach ($categories as $entry) {
            $categoryId = (int) ($entry['id'] ?? 0);
            $categoryName = trim((string) ($entry['name'] ?? ''));
            if ($categoryId <= 0 || $categoryName === '') {
                continue;
            }
            $categoryTrail = $this->normalizeTrail($trail, $categoryName);
            $categoryKey = $categoryId . '|' . implode('>', $categoryTrail);
            if (in_array($categoryKey, $queuedKeys, true) || in_array($categoryKey, (array) ($state['visited'] ?? []), true)) {
                continue;
            }

            $state['pendingCategories'][] = [
                'parentId' => $categoryId,
                'trail' => $categoryTrail,
                'depth' => (int) ($category['depth'] ?? 0) + 1,
            ];
            if (count((array) ($state['categorySamples'] ?? [])) < 12) {
                $state['categorySamples'][] = [
                    'id' => $categoryId,
                    'name' => $categoryName,
                    'path' => implode(' / ', $categoryTrail),
                ];
            }
        }

        if ($products->isEmpty() && $categories->isEmpty() && $parentId > 0) {
            $state['leafProductCandidates'] = (int) ($state['leafProductCandidates'] ?? 0) + 1;
        }

        if ((int) ($state['discoveredProducts'] ?? 0) > (int) ($state['maxDiscoveredProducts'] ?? 12000)) {
            $state['status'] = 'completed';
            $state['stage'] = 'scan_completed_with_limit';
            $state['warnings'][] = 'تم إيقاف الفحص عند حد الحماية للمنتجات. افحص قسمًا أصغر للحصول على نتائج أدق.';
            $state['lastMessage'] = end($state['warnings']);
            return $state;
        }

        $state['lastMessage'] = 'تم فحص قسم واحد: +' . $categories->count() . ' أقسام، +' . $products->count() . ' منتجات.';

        if (empty($state['pendingCategories'])) {
            $state['status'] = 'completed';
            $state['stage'] = 'scan_completed';
            $state['currentItem'] = null;
            $state['lastMessage'] = 'اكتمل فحص القسم. راجع التقرير ثم ابدأ الاستيراد عند التأكد.';
        }

        return $state;
    }

    protected function formatScanProgress(array $state): array
    {
        $status = (string) ($state['status'] ?? 'running');
        $stage = (string) ($state['stage'] ?? 'scan');
        $scanned = (int) ($state['scannedCategories'] ?? 0);
        $pending = count((array) ($state['pendingCategories'] ?? []));
        $categorySamples = array_values((array) ($state['categorySamples'] ?? []));
        $productSamples = array_values((array) ($state['productSamples'] ?? []));

        // بعض مزودات Shams ترجع معلومات مفيدة قبل تحديث العدادات بالكامل.
        // لذلك لا نعرض أصفارًا مضللة إذا كانت أمثلة الأقسام/المنتجات موجودة فعليًا.
        $discoveredCategories = max((int) ($state['discoveredCategories'] ?? 0), count($categorySamples));
        $discoveredProducts = max((int) ($state['discoveredProducts'] ?? 0), count($productSamples));
        $totalKnown = max(1, $scanned + $pending);
        $percentage = $status === 'completed'
            ? 100
            : min(99, (int) floor(($scanned / $totalKnown) * 100));

        $display = $status === 'completed'
            ? ('اكتمل الفحص: ' . $discoveredCategories . ' قسم / ' . $discoveredProducts . ' منتج')
            : ('فُحص ' . $scanned . ' قسم، متبقي ' . $pending . '، مكتشف ' . $discoveredCategories . ' قسم / ' . $discoveredProducts . ' منتج');

        return [
            'providerName' => $state['providerName'] ?? null,
            'status' => $status,
            'stage' => $stage,
            'scannedCategories' => $scanned,
            'pendingCategories' => $pending,
            'totalKnownCategories' => $totalKnown,
            'discoveredCategories' => $discoveredCategories,
            'discoveredProducts' => $discoveredProducts,
            'leafProductCandidates' => (int) ($state['leafProductCandidates'] ?? 0),
            'unavailableProducts' => (int) ($state['unavailableProducts'] ?? 0),
            'playerIdProducts' => (int) ($state['playerIdProducts'] ?? 0),
            'amountProducts' => (int) ($state['amountProducts'] ?? 0),
            'packageProducts' => (int) ($state['packageProducts'] ?? 0),
            'categorySamples' => $categorySamples,
            'productSamples' => $productSamples,
            'warnings' => array_values((array) ($state['warnings'] ?? [])),
            'currentItem' => $state['currentItem'] ?? null,
            'lastMessage' => $state['lastMessage'] ?? null,
            'error' => $state['error'] ?? null,
            'percentage' => $percentage,
            'display' => $display,
            'canImport' => $status === 'completed' && $discoveredProducts > 0,
        ];
    }

    public function startCategoryImport(Request $request)
    {
        $validated = $request->validate([
            'providerSourceId' => ['required', 'integer', 'exists:provider_sources,id'],
            'remoteParentId' => ['nullable', 'integer'],
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
            'trail' => ['nullable', 'array'],
            'trail.*' => ['string'],
        ]);

        $providerSource = ProviderSource::query()->where('is_active', true)->findOrFail($validated['providerSourceId']);
        if ($message = $this->providerImportError($providerSource)) {
            return response()->json(['message' => $message], 422);
        }

        $initialTrail = $this->normalizeTrail($validated['trail'] ?? []);
        $rootSectionId = isset($validated['sectionId']) ? (int) $validated['sectionId'] : null;

        // إذا كان الأدمن داخل قسم مزود مثل "الألعاب" ولم يختر قسمًا محليًا،
        // نستخدم أول اسم من مسار المزود كقسم محلي رئيسي بدل رمي المنتجات في قسم عام.
        if (empty($validated['root']) && empty($rootSectionId) && !empty($initialTrail)) {
            $autoRootName = trim((string) ($initialTrail[0] ?? ''));
            if ($autoRootName !== '') {
                $autoRoot = Section::query()->firstOrCreate(
                    ['name' => $autoRootName, 'section_id' => 0],
                    [
                        'description' => 'قسم رئيسي تم إنشاؤه تلقائيًا من مسار المزود أثناء الاستيراد.',
                        'icon' => '/favicon.ico',
                        'background' => null,
                    ]
                );
                $rootSectionId = $autoRoot->id;
            }
        }

        $jobId = (string) Str::uuid();
        $state = [
            'jobId' => $jobId,
            'providerSourceId' => $providerSource->id,
            'remoteParentId' => (int) ($validated['remoteParentId'] ?? 0),
            'sectionId' => $rootSectionId,
            'root' => !empty($validated['root']),
            'trail' => $initialTrail,
            'status' => 'running',
            'stage' => 'scanning',
            'pendingCategories' => [[
                'parentId' => (int) ($validated['remoteParentId'] ?? 0),
                'trail' => $initialTrail,
            ]],
            'pendingProducts' => [],
            'visited' => [],
            'queuedProductKeys' => [],
            'processedProductKeys' => [],
            'scannedCategories' => 0,
            'maxScannedCategories' => 1500,
            'maxDiscoveredProducts' => 8000,
            'totalProducts' => 0,
            'discoveredProducts' => 0,
            'processedProducts' => 0,
            'importedProducts' => 0,
            'addedCards' => 0,
            'existingCards' => 0,
            'failedProducts' => 0,
            'currentItem' => null,
            'error' => null,
            'lastMessage' => 'بدأ تجهيز الاستيراد…',
        ];

        $this->putImportState($request, $jobId, $state);

        return response()->json([
            'jobId' => $jobId,
            'status' => $state['status'],
            'stage' => $state['stage'],
            'progress' => $this->formatImportProgress($state),
        ]);
    }

    public function processCategoryImport(Request $request)
    {
        $validated = $request->validate([
            'jobId' => ['required', 'string'],
        ]);

        $state = $this->getImportState($request, $validated['jobId']);
        if (!is_array($state)) {
            return response()->json(['message' => 'انتهت جلسة الاستيراد أو لم تعد موجودة.'], 404);
        }

        if (($state['status'] ?? null) !== 'running') {
            return response()->json([
                'jobId' => $validated['jobId'],
                'status' => $state['status'] ?? 'failed',
                'stage' => $state['stage'] ?? 'idle',
                'progress' => $this->formatImportProgress($state),
            ]);
        }

        $providerSource = ProviderSource::query()->where('is_active', true)->find($state['providerSourceId'] ?? 0);
        if (!$providerSource) {
            $state['status'] = 'failed';
            $state['error'] = 'المزود غير متاح الآن.';
            $this->putImportState($request, $validated['jobId'], $state);

            return response()->json([
                'jobId' => $validated['jobId'],
                'status' => $state['status'],
                'stage' => $state['stage'] ?? 'idle',
                'progress' => $this->formatImportProgress($state),
            ]);
        }

        try {
            $state = $this->processNextImportStep($providerSource, $state);
        } catch (\Throwable $exception) {
            report($exception);
            $state['status'] = 'failed';
            $state['error'] = trim((string) $exception->getMessage()) ?: 'تعذر إكمال الاستيراد.';
            $state['lastMessage'] = $state['error'];
        }

        $this->putImportState($request, $validated['jobId'], $state);

        return response()->json([
            'jobId' => $validated['jobId'],
            'status' => $state['status'],
            'stage' => $state['stage'] ?? 'idle',
            'progress' => $this->formatImportProgress($state),
        ]);
    }

    public function importProgress(Request $request)
    {
        $validated = $request->validate([
            'jobId' => ['required', 'string'],
        ]);

        $state = $this->getImportState($request, $validated['jobId']);
        if (!is_array($state)) {
            return response()->json(['message' => 'انتهت جلسة الاستيراد أو لم تعد موجودة.'], 404);
        }

        return response()->json([
            'jobId' => $validated['jobId'],
            'status' => $state['status'] ?? 'idle',
            'stage' => $state['stage'] ?? 'idle',
            'progress' => $this->formatImportProgress($state),
        ]);
    }

    public function publish(Request $request, ImportedProviderProduct $importedProduct): RedirectResponse
    {
        $validated = $request->validate([
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
        ]);

        $result = $this->publishImportedProduct($importedProduct, $validated);

        if ($result['redirect'] ?? null) {
            return redirect()->to($result['redirect'])->with($result['status'], $result['message']);
        }

        return redirect()->back()->with($result['status'], $result['message']);
    }

    protected function importCategoryRecursively(
        ProviderSource $providerSource,
        int $remoteParentId,
        array $trail,
        array $target,
        array &$stats
    ): void
    {
        $trail = $this->normalizeTrail($trail);
        if (empty($target['sectionId']) && empty($target['root']) && !empty($trail)) {
            $autoRootName = trim((string) ($trail[0] ?? ''));
            if ($autoRootName !== '') {
                $autoRoot = Section::query()->firstOrCreate(
                    ['name' => $autoRootName, 'section_id' => 0],
                    ['description' => 'قسم رئيسي تم إنشاؤه تلقائيًا من مسار المزود أثناء الاستيراد.', 'icon' => '/favicon.ico', 'background' => null]
                );
                $target['sectionId'] = $autoRoot->id;
            }
        }

        $visitKey = (string) $remoteParentId . '|' . implode('>', $trail);
        if (in_array($visitKey, $stats['visited'] ?? [], true)) {
            return;
        }
        $stats['visited'][] = $visitKey;

        $catalog = $this->providerGateway->catalog($providerSource, $remoteParentId);

        $categories = collect((array) ($catalog['categories'] ?? []))
            ->filter(fn ($category) => is_array($category))
            ->unique(fn ($category) => (string) ($category['id'] ?? ''))
            ->values();

        foreach ($categories as $category) {
            $categoryId = (int) ($category['id'] ?? 0);
            $categoryName = trim((string) ($category['name'] ?? ''));

            if ($categoryId <= 0 || $categoryName === '') {
                continue;
            }

            $categoryTrail = $this->normalizeTrail($trail, $categoryName);
            $localCategoryTrail = $this->stripRootNameFromTrail($categoryTrail, (int) ($target['sectionId'] ?? 0));
            if (!empty($localCategoryTrail)) {
                $this->findOrCreateSectionPathFromNames(
                    $localCategoryTrail,
                    $category['image'] ?? null,
                    'تم إنشاؤه تلقائيًا أثناء استيراد أقسام المزود.',
                    (int) ($target['sectionId'] ?? 0)
                );
            }

            $this->importCategoryRecursively($providerSource, $categoryId, $categoryTrail, $target, $stats);
        }

        $products = collect((array) ($catalog['products'] ?? []))
            ->filter(fn ($product) => is_array($product))
            ->unique(fn ($product) => (string) ($product['id'] ?? ''))
            ->values();

        foreach ($products as $product) {
            try {
                $normalizedProduct = (array) $product;
                $rawProduct = (array) $product;

                try {
                    $preview = $this->providerGateway->preview($providerSource, (string) ($product['id'] ?? ''));
                    $normalizedProduct = (array) ($preview['normalized'] ?? $normalizedProduct);
                    $rawProduct = (array) ($preview['raw'] ?? $rawProduct);
                } catch (\Throwable $previewException) {
                    report($previewException);
                }

                $productTrail = $this->normalizeProductTrail($trail, $normalizedProduct, $product);
                $imported = $this->upsertImportedProduct($providerSource, $normalizedProduct, $rawProduct, $productTrail, $remoteParentId);
                $stats['imported_products']++;
                $result = $this->publishImportedProduct($imported, [
                    'rootSectionId' => $target['sectionId'] ?? null,
                    'root' => !empty($target['root']),
                ]);
                if (($result['created'] ?? false) === true) {
                    $stats['added_cards']++;
                } elseif (($result['updated'] ?? false) === true) {
                    $stats['existing_cards']++;
                }
            } catch (\Throwable $exception) {
                report($exception);
                $stats['failed']++;
            }
        }
    }

    protected function publishGroupedProducts(ProviderSource $providerSource, Collection $products, array $trail, array $validated, int $remoteParentId): array
    {
        $first = $products->first();
        if (! $first) {
            throw new \RuntimeException('لا توجد منتجات قابلة للتجميع.');
        }

        $groupName = trim((string) ($first['categoryName'] ?? '')) ?: trim((string) ($trail ? end($trail) : '')) ?: trim((string) ($first['name'] ?? 'منتج'));
        $section = ! empty($validated['sectionId'])
            ? Section::query()->find($validated['sectionId'])
            : (! empty($validated['root']) ? null : $this->findOrCreateSectionPathFromNames($this->normalizeTrail($trail, $first['categoryName'] ?? null), $first['image'] ?? null, 'تم إنشاؤه تلقائيًا أثناء استيراد منتجات المزود.'));

        $existing = Card::query()
            ->where('provider_source_id', $providerSource->id)
            ->where('name', $groupName)
            ->where('section_id', $section?->id ?? 0)
            ->first();

        if ($existing) {
            return [
                'status' => 'warning',
                'message' => 'هذه البطاقة المجمعة موجودة مسبقًا في نفس القسم.',
                'redirect' => null,
            ];
        }

        $sorted = $products->sortBy(fn ($product) => (float) ($product['price'] ?? 0))->values();
        $optionLabels = $sorted->map(fn ($product) => trim((string) ($product['name'] ?? 'منتج')))->values();
        $optionPrices = [];
        $optionCosts = [];
        $providerOptionProductIds = [];
        foreach ($sorted as $product) {
            $label = trim((string) ($product['name'] ?? 'منتج'));
            $optionPrices[$label] = (float) ($product['price'] ?? 0);
            $optionCosts[$label] = (float) ($product['providerCostPrice'] ?? $product['costPrice'] ?? $product['basePrice'] ?? $product['price'] ?? 0);
            $providerOptionProductIds[$label] = (string) ($product['id'] ?? '');
            $this->upsertImportedProduct($providerSource, (array) $product, (array) $product, $this->normalizeTrail($trail, $product['categoryName'] ?? null), $remoteParentId);
        }

        Card::query()->create([
            'name' => $groupName,
            'section_id' => $section?->id ?? 0,
            'provider_source_id' => $providerSource->id,
            'background' => $first['image'] ?? null,
            'icon' => $first['image'] ?? ($section?->icon ?: '/favicon.ico'),
            'description' => implode(' / ', $this->normalizeTrail($trail, $first['categoryName'] ?? null)),
            'price' => (float) min($optionPrices ?: [0]),
            'minAmount' => 1,
            'maxAmount' => 1,
            'discount' => 0,
            'sawaCardId' => '0',
            'provider_product_id' => null,
            'cost_price' => (float) min($optionCosts ?: [0]),
            'provider_cost_price' => (float) min($optionCosts ?: [0]),
            'price_adjustment_percentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
            'profit_percentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
            'is_active' => true,
            'requires_player_id' => (bool) ($first['requiresPlayerId'] ?? false),
            'player_id_label' => $first['playerIdLabel'] ?? 'معرّف اللاعب',
            'quantity_label' => 'الفئة',
            'amount_mode' => 'quantity',
            'delivery_mode' => $first['deliveryMode'] ?? 'api_codes',
            'provider_product_type' => $first['providerProductType'] ?? 'package',
            'provider_qty_values' => $optionLabels->all(),
            'provider_params' => $first['providerParams'] ?? [],
            'purchase_flow' => $first['purchaseFlow'] ?? 'player_category',
            'requires_secondary_player_id' => (bool) ($first['requiresSecondaryPlayerId'] ?? false),
            'secondary_player_id_label' => $first['secondaryPlayerIdLabel'] ?? 'المعرّف الثاني / السيرفر',
            'option_prices' => $optionPrices,
            'option_costs' => $optionCosts,
            'provider_option_product_ids' => $providerOptionProductIds,
        ]);

        return [
            'status' => 'success',
            'message' => 'تمت إضافة بطاقة مجمعة للفئات كما هي عند المزود.',
            'redirect' => $section ? route('sections.show', $section->id) : route('sections.main'),
        ];
    }

    protected function upsertImportedProduct(ProviderSource $providerSource, array $normalizedProduct, array $rawProduct, array $trail, int $remoteParentId = 0): ImportedProviderProduct
    {
        $remoteId = (string) ($normalizedProduct['id'] ?? '');
        if ($remoteId === '') {
            throw new \RuntimeException('Invalid remote product id.');
        }

        $normalizedTrail = $this->normalizeTrail($trail, $normalizedProduct['categoryName'] ?? null);

        return DB::transaction(function () use ($providerSource, $remoteId, $normalizedProduct, $rawProduct, $normalizedTrail, $remoteParentId) {
            return ImportedProviderProduct::query()->updateOrCreate(
                [
                    'provider_source_id' => $providerSource->id,
                    'remote_id' => $remoteId,
                ],
                [
                    'remote_parent_id' => (string) (($normalizedProduct['parentId'] ?? $remoteParentId) ?: ''),
                    'category_path' => $normalizedTrail ? implode(' / ', $normalizedTrail) : null,
                    'category_names' => $normalizedTrail ?: null,
                    'name' => (string) ($normalizedProduct['name'] ?? 'منتج'),
                    'description' => (string) ($normalizedProduct['description'] ?? $normalizedProduct['categoryName'] ?? ''),
                    'image' => $normalizedProduct['image'] ?? null,
                    'provider_product_type' => $normalizedProduct['providerProductType'] ?? $normalizedProduct['productType'] ?? 'package',
                    'price' => (float) ($normalizedProduct['price'] ?? 0),
                    'base_price' => (float) ($normalizedProduct['basePrice'] ?? $normalizedProduct['price'] ?? 0),
                    'cost_price' => (float) ($normalizedProduct['costPrice'] ?? $normalizedProduct['basePrice'] ?? $normalizedProduct['price'] ?? 0),
                    'provider_cost_price' => (float) ($normalizedProduct['providerCostPrice'] ?? $normalizedProduct['costPrice'] ?? $normalizedProduct['basePrice'] ?? $normalizedProduct['price'] ?? 0),
                    'available' => (bool) ($normalizedProduct['available'] ?? true),
                    'requires_player_id' => (bool) ($normalizedProduct['requiresPlayerId'] ?? false),
                    'requires_secondary_player_id' => (bool) ($normalizedProduct['requiresSecondaryPlayerId'] ?? false),
                    'player_id_label' => $normalizedProduct['playerIdLabel'] ?? 'معرّف اللاعب',
                    'secondary_player_id_label' => $normalizedProduct['secondaryPlayerIdLabel'] ?? 'المعرّف الثاني / السيرفر',
                    'quantity_label' => $normalizedProduct['quantityLabel'] ?? 'الكمية',
                    'amount_mode' => $normalizedProduct['amountMode'] ?? 'quantity',
                    'delivery_mode' => $normalizedProduct['deliveryMode'] ?? 'manual_review',
                    'purchase_flow' => $normalizedProduct['purchaseFlow'] ?? 'codes_quantity',
                    'min_amount' => max(1, (int) ($normalizedProduct['minAmount'] ?? 1)),
                    'max_amount' => max(1, (int) ($normalizedProduct['maxAmount'] ?? 1)),
                    'provider_qty_values' => $normalizedProduct['providerQtyValues'] ?? $normalizedProduct['qtyValues'] ?? null,
                    'provider_params' => $normalizedProduct['providerParams'] ?? $normalizedProduct['params'] ?? null,
                    'raw_payload' => $rawProduct,
                ]
            );
        });
    }
    protected function isSwGamesSource(ProviderSource $providerSource): bool
    {
        return $providerSource->driver === 'swgames'
            || str_contains(mb_strtolower((string) $providerSource->base_url), 'sw-games.net/api/fastapi');
    }

    protected function publishImportedProduct(ImportedProviderProduct $importedProduct, array $validated): array
    {
        $section = $this->resolveTargetSection($validated, $importedProduct);
        if (! $section) {
            throw new \RuntimeException('تعذر تحديد القسم المحلي لهذا المنتج. اختر قسمًا هدفًا أو ادخل إلى قسم واضح من المزود قبل الاستيراد.');
        }
        $pricing = $this->resolveCardPricing($importedProduct);

        $existing = Card::query()
            ->where('provider_source_id', $importedProduct->provider_source_id)
            ->where('section_id', $section?->id ?? 0)
            ->where(function ($query) use ($importedProduct) {
                $query->where('provider_product_id', $importedProduct->remote_id)
                    ->orWhere('sawaCardId', $importedProduct->remote_id);
            })
            ->first();

        if (! $existing && $section) {
            $existing = Card::query()
                ->where('provider_source_id', $importedProduct->provider_source_id)
                ->where('section_id', $section->id)
                ->where('name', $importedProduct->name)
                ->first();
        }

        $icon = $importedProduct->image ?: ($section?->icon ?: '/favicon.ico');

        $payload = [
            'name' => $importedProduct->name,
            'section_id' => $section?->id ?? 0,
            'provider_source_id' => $importedProduct->provider_source_id,
            'background' => $importedProduct->image,
            'icon' => $icon,
            'description' => $importedProduct->description ?: ($importedProduct->category_path ?: null),
            'price' => $pricing['price'],
            'minAmount' => (int) ($importedProduct->min_amount ?: 1),
            'maxAmount' => (int) ($importedProduct->max_amount ?: 1),
            'discount' => 0,
            'sawaCardId' => $importedProduct->remote_id,
            'provider_product_id' => $importedProduct->remote_id,
            'cost_price' => $pricing['cost_price'],
            'provider_cost_price' => $pricing['provider_cost_price'],
            'price_adjustment_percentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
            'profit_percentage' => (float) Setting::get('pricing.global_markup_percentage', 0),
            'is_active' => true,
            'requires_player_id' => (bool) $importedProduct->requires_player_id,
            'player_id_label' => $importedProduct->player_id_label ?: 'معرّف اللاعب',
            'quantity_label' => $importedProduct->quantity_label ?: 'الكمية',
            'amount_mode' => $importedProduct->amount_mode ?: 'quantity',
            'delivery_mode' => $importedProduct->delivery_mode ?: 'manual_review',
            'provider_product_type' => $importedProduct->provider_product_type ?: 'package',
            'provider_qty_values' => $importedProduct->provider_qty_values,
            'provider_params' => $importedProduct->provider_params,
            'purchase_flow' => $importedProduct->purchase_flow ?: 'codes_quantity',
            'requires_secondary_player_id' => (bool) $importedProduct->requires_secondary_player_id,
            'secondary_player_id_label' => $importedProduct->secondary_player_id_label ?: 'المعرّف الثاني / السيرفر',
            'option_prices' => null,
            'option_costs' => null,
            'provider_option_product_ids' => null,
        ];

        if ($existing) {
            $existing->fill($payload);
            $existing->save();

            return [
                'status' => 'success',
                'message' => 'كان المنتج موجودًا مسبقًا، وتم تحديثه وربطه بالقسم الحالي.',
                'redirect' => $section ? route('sections.show', $section->id) : route('sections.main'),
                'created' => false,
                'updated' => true,
            ];
        }

        Card::query()->create($payload);

        return [
            'status' => 'success',
            'message' => 'تمت إضافة المنتج المستورد إلى المتجر.',
            'redirect' => $section ? route('sections.show', $section->id) : route('sections.main'),
            'created' => true,
            'updated' => false,
        ];
    }

    protected function ensureImportedProductsFallbackSection(): Section
    {
        return Section::query()->firstOrCreate(
            [
                'name' => 'منتجات مستوردة',
                'section_id' => 0,
            ],
            [
                'description' => 'قسم تلقائي للمنتجات المستوردة التي لا تملك قسمًا ظاهرًا.',
                'background' => null,
                'icon' => '/favicon.ico',
            ]
        );
    }

    protected function resolveCardPricing(ImportedProviderProduct $importedProduct): array
    {
        $candidates = collect([
            $importedProduct->provider_cost_price,
            $importedProduct->cost_price,
            $importedProduct->base_price,
            $importedProduct->price,
            data_get($importedProduct->raw_payload, 'base_price'),
            data_get($importedProduct->raw_payload, 'price'),
        ])->map(fn ($value) => is_numeric($value) ? $this->moneyRound((float) $value) : 0)->filter(fn ($value) => $value > 0)->values();

        $providerCost = (float) ($candidates->first() ?? 0);
        $sourcePrice = (float) ($candidates->skip(1)->first() ?? $providerCost);
        $globalMarkup = (float) Setting::get('pricing.global_markup_percentage', 0);

        $sellingPrice = $sourcePrice > 0 ? $sourcePrice : $providerCost;
        if ($providerCost > 0 && $globalMarkup != 0.0) {
            $sellingPrice = $this->moneyRound($providerCost * (1 + ($globalMarkup / 100)));
        }

        if ($providerCost > 0 && $sellingPrice < $providerCost) {
            $sellingPrice = $providerCost;
        }

        return [
            'price' => $this->moneyRound(max($sellingPrice, 0)),
            'cost_price' => $this->moneyRound(max($providerCost, 0)),
            'provider_cost_price' => $this->moneyRound(max($providerCost, 0)),
        ];
    }

    protected function moneyRound(float $value, int $precision = 8): float
    {
        return round($value, $precision);
    }

    protected function resolveTargetSection(array $validated, ImportedProviderProduct $importedProduct): ?Section
    {
        if (! empty($validated['root'])) {
            return null;
        }

        // Batch/category imports may pass a local root section. In that case we keep remote categories
        // as children below the selected root instead of putting every product in one local section.
        if (! empty($validated['rootSectionId'])) {
            $rootSection = Section::query()->find((int) $validated['rootSectionId']);
            if (! $rootSection) {
                return $this->findOrCreateSectionPath($importedProduct);
            }

            $names = $this->stripRootNameFromTrail(
                $this->sectionNamesFromImportedProduct($importedProduct),
                $rootSection->id
            );

            if (empty($names)) {
                return $rootSection;
            }

            return $this->findOrCreateSectionPathFromNames(
                $names,
                $importedProduct->image,
                'تم إنشاؤه تلقائيًا أثناء استيراد منتجات المزود.',
                $rootSection->id
            );
        }

        if (! empty($validated['sectionId'])) {
            return Section::query()->find($validated['sectionId']);
        }

        return $this->findOrCreateSectionPath($importedProduct);
    }

    protected function sectionNamesFromImportedProduct(ImportedProviderProduct $importedProduct): array
    {
        $names = collect($importedProduct->category_names ?? [])
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($names->isEmpty() && filled($importedProduct->category_path)) {
            $names = collect(explode('/', (string) $importedProduct->category_path))
                ->map(fn ($name) => trim((string) $name))
                ->filter()
                ->values();
        }

        if ($names->isEmpty() && filled(data_get($importedProduct->raw_payload, 'category_name'))) {
            $names = collect([trim((string) data_get($importedProduct->raw_payload, 'category_name'))])->filter()->values();
        }

        return $names->all();
    }

    protected function findOrCreateSectionPath(ImportedProviderProduct $importedProduct): ?Section
    {
        $names = collect($importedProduct->category_names ?? [])
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($names->isEmpty() && filled($importedProduct->category_path)) {
            $names = collect(explode('/', (string) $importedProduct->category_path))
                ->map(fn ($name) => trim((string) $name))
                ->filter()
                ->values();
        }

        if ($names->isEmpty() && filled(data_get($importedProduct->raw_payload, 'category_name'))) {
            $names = collect([trim((string) data_get($importedProduct->raw_payload, 'category_name'))])->filter()->values();
        }

        if ($names->isEmpty()) {
            return null;
        }

        return $this->findOrCreateSectionPathFromNames($names->all(), $importedProduct->image, 'تم إنشاؤه تلقائيًا أثناء استيراد منتجات المزود.');
    }

    protected function stripRootNameFromTrail(array $names, int $rootSectionId = 0): array
    {
        $names = collect($names)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($rootSectionId > 0) {
            $rootSection = Section::query()->find($rootSectionId);
            $rootName = $rootSection ? mb_strtolower(preg_replace('/\s+/u', ' ', trim((string) $rootSection->name))) : null;

            while ($rootName && $names->isNotEmpty()) {
                $first = mb_strtolower(preg_replace('/\s+/u', ' ', trim((string) $names->first())));
                if ($first !== $rootName) {
                    break;
                }
                $names->shift();
                $names = $names->values();
            }
        }

        return $names->all();
    }

    protected function findOrCreateSectionPathFromNames(array $names, ?string $icon = null, string $description = 'تم إنشاؤه تلقائيًا أثناء استيراد منتجات المزود.', int $parentId = 0): ?Section
    {
        $names = collect($names)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($names->isEmpty()) {
            return null;
        }

        $parentId = max(0, $parentId);
        $section = null;
        foreach ($names as $name) {
            $section = Section::query()->firstOrCreate(
                ['name' => $name, 'section_id' => $parentId],
                [
                    'description' => $description,
                    'icon' => $icon ?: '/favicon.ico',
                    'background' => null,
                ]
            );
            $parentId = $section->id;
        }

        return $section;
    }



    protected function normalizeProductTrail(array $trail, array $normalizedProduct, array $fallbackProduct = []): array
    {
        $productNameForTrail = trim((string) ($normalizedProduct['name'] ?? $fallbackProduct['name'] ?? ''));
        $normalizeComparable = fn ($value) => mb_strtolower(preg_replace('/\s+/u', ' ', trim((string) $value)));
        $cleanTrail = function ($names) use ($productNameForTrail, $normalizeComparable) {
            $names = collect($names)->map(fn ($name) => trim((string) $name))->filter()->values();
            if ($productNameForTrail !== '' && $names->isNotEmpty()) {
                $last = $normalizeComparable($names->last());
                $product = $normalizeComparable($productNameForTrail);
                if ($last !== '' && $last === $product) {
                    $names->pop();
                    $names = $names->values();
                }
            }

            return $names->all();
        };

        $trailNames = collect($cleanTrail($trail));

        // For SW Games products: the trail sent from the frontend already contains the full path
        // (e.g. ["ألعاب", "Free Fire"]). We trust it as-is and only ensure the categoryName
        // (game name) is present. This prevents products from landing in the wrong parent section.
        $providerType = (string) ($normalizedProduct['providerProductType'] ?? $fallbackProduct['providerProductType'] ?? '');
        $categoryName = trim((string) ($normalizedProduct['categoryName'] ?? $fallbackProduct['categoryName'] ?? ''));
        if ($providerType === 'swgames') {
            // If categoryName is a real game name (not the fallback "SW Games"), ensure it's in the trail
            if ($categoryName !== '' && $categoryName !== 'SW Games') {
                $lastTrailNormalized = $trailNames->isNotEmpty() ? $normalizeComparable($trailNames->last()) : '';
                $categoryNormalized = $normalizeComparable($categoryName);
                if ($categoryNormalized !== '' && $lastTrailNormalized !== $categoryNormalized) {
                    $trailNames->push($categoryName);
                }
            }
            // If trail is empty but we have a categoryName, use it as the trail
            if ($trailNames->isEmpty() && $categoryName !== '' && $categoryName !== 'SW Games') {
                $trailNames = collect([$categoryName]);
            }
            return $cleanTrail($trailNames->all());
        }

        // For Shams/generic providers: try to enrich trail from product's categoryName/categoryPath
        $categoryCandidates = collect([
            $normalizedProduct['categoryPath'] ?? null,
            $normalizedProduct['category_path'] ?? null,
            $normalizedProduct['categoryName'] ?? null,
            $fallbackProduct['categoryPath'] ?? null,
            $fallbackProduct['category_name'] ?? null,
            $fallbackProduct['categoryName'] ?? null,
        ])->filter();

        foreach ($categoryCandidates as $candidate) {
            $parts = collect(is_array($candidate) ? $candidate : preg_split('/[\/|>-]+/u', (string) $candidate))
                ->map(fn ($part) => trim((string) $part))
                ->filter()
                ->values();

            if ($parts->isEmpty()) {
                continue;
            }

            $candidateLast = (string) $parts->last();
            $trailLast = (string) $trailNames->last();
            if ($trailNames->isNotEmpty() && $candidateLast !== '' && mb_strtolower($candidateLast) === mb_strtolower($trailLast)) {
                return $cleanTrail($trailNames->all());
            }

            if ($parts->count() >= $trailNames->count() && $trailNames->isNotEmpty()) {
                $tail = $parts->slice(-1 * $trailNames->count())->values();
                if ($tail->map(fn ($v) => mb_strtolower((string) $v))->all() === $trailNames->map(fn ($v) => mb_strtolower((string) $v))->all()) {
                    return $cleanTrail($parts->all());
                }
            }

            if ($trailNames->isEmpty()) {
                return $cleanTrail($parts->all());
            }
        }

        return $cleanTrail($trailNames->all());
    }

    protected function normalizeTrail(array $trail, ?string $fallbackName = null): array
    {
        $names = collect($trail)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        $fallbackName = trim((string) ($fallbackName ?? ''));
        if ($fallbackName !== '' && $names->last() !== $fallbackName) {
            $names->push($fallbackName);
        }

        return $names->unique()->values()->all();
    }

    protected function processNextImportStep(ProviderSource $providerSource, array $state): array
    {
        // Step 1: import a small batch of already discovered products immediately.
        // Products are saved to imported_provider_products and published to cards during every poll,
        // so a timeout later does not lose what was already processed.
        $batchSize = max(1, min(20, (int) ($state['batchSize'] ?? 12)));
        $processedThisRequest = 0;

        if (!empty($state['pauseUntil'])) {
            $pauseUntil = (int) $state['pauseUntil'];
            if ($pauseUntil > time()) {
                $remaining = max(1, $pauseUntil - time());
                $state['stage'] = 'provider_rate_limited';
                $state['currentItem'] = 'انتظار حد طلبات المزود';
                $state['lastMessage'] = 'تم إيقاف الاستيراد مؤقتًا بسبب حد طلبات المزود. سيحاول المتابعة تلقائيًا بعد حوالي ' . ceil($remaining / 60) . ' دقيقة.';
                return $state;
            }

            unset($state['pauseUntil'], $state['rateLimitProviderId']);
            $state['stage'] = 'resuming_after_rate_limit';
            $state['lastMessage'] = 'انتهت مهلة الانتظار، سيتم متابعة الاستيراد الآن.';
        }

        while (!empty($state['pendingProducts']) && $processedThisRequest < $batchSize) {
            $state = $this->processOneQueuedImportProduct($providerSource, $state);
            $processedThisRequest++;
        }

        if ($processedThisRequest > 0) {
            return $this->finalizeImportStateIfDone($state);
        }

        // Step 2: scan exactly one remote category per request, then queue its products.
        // This keeps every remote category mapped to the correct local path and prevents long requests.
        if (!empty($state['pendingCategories'])) {
            $category = array_shift($state['pendingCategories']);
            $parentId = (int) ($category['parentId'] ?? 0);
            $trail = $this->normalizeTrail((array) ($category['trail'] ?? []));
            $visitKey = (string) $parentId . '|' . implode('>', $trail);

            if (in_array($visitKey, $state['visited'] ?? [], true)) {
                return $this->finalizeImportStateIfDone($state);
            }

            $maxScannedCategories = (int) ($state['maxScannedCategories'] ?? 1500);
            $state['scannedCategories'] = (int) ($state['scannedCategories'] ?? 0) + 1;
            if ($maxScannedCategories > 0 && $state['scannedCategories'] > $maxScannedCategories) {
                $state['status'] = 'completed';
                $state['stage'] = 'completed_with_limit';
                $state['error'] = 'تم إيقاف الاستيراد لأن عدد الأقسام المكتشفة تجاوز حد الحماية. يمكنك تشغيل الاستيراد مرة أخرى للمتابعة.';
                $state['lastMessage'] = $state['error'];
                return $state;
            }

            $state['visited'][] = $visitKey;
            $state['stage'] = 'scanning_category';
            $state['currentItem'] = $trail ? ('قسم: ' . implode(' / ', $trail)) : 'القسم الرئيسي';
            $state['lastMessage'] = 'جارٍ فحص القسم الحالي ثم حفظ منتجاته تدريجيًا…';

            try {
                $catalog = $this->catalogWithRetry($providerSource, $parentId);
            } catch (\Throwable $exception) {
                if ($this->isProviderRateLimitException($exception)) {
                    return $this->pauseImportForProviderRateLimit($state, $providerSource, $exception);
                }

                throw $exception;
            }

            $categories = collect((array) ($catalog['categories'] ?? []))
                ->filter(fn ($entry) => is_array($entry))
                ->unique(fn ($entry) => (string) ($entry['id'] ?? ''))
                ->values();

            $products = collect((array) ($catalog['products'] ?? []))
                ->filter(fn ($entry) => is_array($entry) && trim((string) ($entry['id'] ?? '')) !== '')
                ->unique(fn ($entry) => (string) ($entry['id'] ?? ''))
                ->values();

            $queuedCategoryKeys = collect((array) ($state['pendingCategories'] ?? []))
                ->map(fn ($item) => (string) ((int) ($item['parentId'] ?? 0)) . '|' . implode('>', $this->normalizeTrail((array) ($item['trail'] ?? []))))
                ->all();

            $addedCategories = 0;
            foreach ($categories as $entry) {
                $categoryId = (int) ($entry['id'] ?? 0);
                $categoryName = trim((string) ($entry['name'] ?? ''));
                if ($categoryId <= 0 || $categoryName === '') {
                    continue;
                }

                $categoryTrail = $this->normalizeTrail($trail, $categoryName);
                $categoryKey = (string) $categoryId . '|' . implode('>', $categoryTrail);
                if (in_array($categoryKey, $state['visited'] ?? [], true) || in_array($categoryKey, $queuedCategoryKeys, true)) {
                    continue;
                }

                // لا ننشئ قسمًا في المتجر لمجرد أن المزود سمّاه category.
                // بعض عناصر Shams تكون منتجات فعلية لكنها تأتي ضمن content بلا تفاصيل سعر في أول طلب.
                // ننشئ القسم لاحقًا فقط إذا أثبت الفحص أن داخله منتجات/أقسام، وإلا نحوله لمنتج داخل القسم الأب.
                $state['pendingCategories'][] = [
                    'parentId' => $categoryId,
                    'trail' => $categoryTrail,
                    'parentTrail' => $trail,
                    'image' => $entry['image'] ?? null,
                ];
                $queuedCategoryKeys[] = $categoryKey;
                $addedCategories++;
            }

            // إذا ظهر أن القسم الحالي حقيقي وفيه منتجات أو أقسام، ننشئ مساره الآن فقط.
            // عند وجود قسم جذري محلي مثل "الألعاب" لا نكرر اسم الجذر كقسم داخلي تحته.
            if ($categories->isNotEmpty() || $products->isNotEmpty()) {
                $localTrail = $this->stripRootNameFromTrail($trail, (int) ($state['sectionId'] ?? 0));
                if (!empty($localTrail)) {
                    $this->findOrCreateSectionPathFromNames(
                        $localTrail,
                        $category['image'] ?? null,
                        'تم إنشاؤه تلقائيًا أثناء استيراد أقسام المزود.',
                        (int) ($state['sectionId'] ?? 0)
                    );
                }
            }

            // إذا كان العنصر leaf فارغًا عند فحصه، قد يكون منتجًا عند Shams وليس قسمًا.
            // نجرب preview مرة واحدة ونضعه كمنتج ضمن القسم الأب بدل إنشاء فئة وهمية باسمه.
            if ($categories->isEmpty() && $products->isEmpty() && $parentId > 0) {
                try {
                    $preview = $this->providerGateway->preview($providerSource, (string) $parentId);
                    $leafProduct = (array) ($preview['normalized'] ?? []);
                    if (!empty($leafProduct['id']) && !empty($leafProduct['name'])) {
                        $products = collect([$leafProduct]);
                        $trail = $this->normalizeTrail((array) ($category['parentTrail'] ?? []));
                        $state['lastMessage'] = 'تم تحويل عنصر من المزود إلى منتج داخل القسم الأب بدل فئة فارغة.';
                    }
                } catch (\Throwable $previewLeafException) {
                    report($previewLeafException);
                }
            }

            $state['queuedProductKeys'] = array_values(array_unique((array) ($state['queuedProductKeys'] ?? [])));
            $state['processedProductKeys'] = array_values(array_unique((array) ($state['processedProductKeys'] ?? [])));
            $maxDiscoveredProducts = (int) ($state['maxDiscoveredProducts'] ?? 8000);
            $addedProducts = 0;

            foreach ($products as $product) {
                $productId = trim((string) ($product['id'] ?? ''));
                if ($productId === '') {
                    continue;
                }

                $productKey = $this->productQueueKey($providerSource, $productId);
                if (in_array($productKey, $state['queuedProductKeys'], true) || in_array($productKey, $state['processedProductKeys'], true)) {
                    continue;
                }

                if ($maxDiscoveredProducts > 0 && (int) ($state['discoveredProducts'] ?? $state['totalProducts'] ?? 0) >= $maxDiscoveredProducts) {
                    $state['error'] = 'تم إيقاف اكتشاف منتجات جديدة مؤقتًا لأن العدد تجاوز حد الحماية. المنتجات المكتشفة ستستمر بالاستيراد.';
                    break;
                }

                $state['pendingProducts'][] = [
                    'product' => (array) $product,
                    'trail' => $trail,
                    'remoteParentId' => $parentId,
                ];
                $state['queuedProductKeys'][] = $productKey;
                $addedProducts++;
            }

            $state['discoveredProducts'] = (int) ($state['discoveredProducts'] ?? $state['totalProducts'] ?? 0) + $addedProducts;
            $state['totalProducts'] = (int) ($state['discoveredProducts'] ?? 0);
            $state['stage'] = $addedProducts > 0 ? 'queued_products' : 'scanned_category';
            $state['lastMessage'] = "تم فحص القسم الحالي: اكتشف {$addedProducts} منتج جديد و {$addedCategories} قسم فرعي. سيتم حفظ المنتجات تدريجيًا الآن.";

            return $this->finalizeImportStateIfDone($state);
        }

        return $this->finalizeImportStateIfDone($state);
    }

    protected function processOneQueuedImportProduct(ProviderSource $providerSource, array $state): array
    {
        $next = array_shift($state['pendingProducts']);
        $product = (array) ($next['product'] ?? []);
        $trail = $this->normalizeTrail((array) ($next['trail'] ?? []));
        $remoteParentId = (int) ($next['remoteParentId'] ?? 0);
        $productId = trim((string) ($product['id'] ?? ''));
        $productKey = $productId !== '' ? $this->productQueueKey($providerSource, $productId) : null;

        if ($productId === '') {
            $state['failedProducts'] = (int) ($state['failedProducts'] ?? 0) + 1;
            $state['processedProducts'] = (int) ($state['processedProducts'] ?? 0) + 1;
            return $state;
        }

        if ($productKey && in_array($productKey, (array) ($state['processedProductKeys'] ?? []), true)) {
            return $state;
        }

        $state['stage'] = 'importing_products';
        $state['currentItem'] = (string) ($product['name'] ?? $productId);
        $state['lastMessage'] = 'جارٍ حفظ منتج ضمن القسم الصحيح…';

        try {
            $normalizedProduct = (array) $product;
            $rawProduct = (array) $product;

            if (
                empty($normalizedProduct['price']) ||
                empty($normalizedProduct['costPrice']) ||
                empty($normalizedProduct['providerCostPrice']) ||
                empty($normalizedProduct['name'])
            ) {
                try {
                    $preview = $this->providerGateway->preview($providerSource, $productId);
                    $normalizedProduct = (array) ($preview['normalized'] ?? $normalizedProduct);
                    $rawProduct = (array) ($preview['raw'] ?? $rawProduct);
                } catch (\Throwable $previewException) {
                    report($previewException);
                }
            }

            $productTrail = $this->normalizeProductTrail($trail, $normalizedProduct, $product);
            $imported = $this->upsertImportedProduct($providerSource, $normalizedProduct, $rawProduct, $productTrail, $remoteParentId);
            $result = $this->publishImportedProduct($imported, [
                'rootSectionId' => $state['sectionId'] ?? null,
                'root' => !empty($state['root']),
            ]);

            $state['importedProducts'] = (int) ($state['importedProducts'] ?? 0) + 1;
            if (($result['created'] ?? false) === true) {
                $state['addedCards'] = (int) ($state['addedCards'] ?? 0) + 1;
            } elseif (($result['updated'] ?? false) === true) {
                $state['existingCards'] = (int) ($state['existingCards'] ?? 0) + 1;
            }
            $state['lastMessage'] = 'تم حفظ منتج داخل المتجر فورًا.';
        } catch (\Throwable $exception) {
            report($exception);
            $state['failedProducts'] = (int) ($state['failedProducts'] ?? 0) + 1;
            $state['lastMessage'] = trim((string) $exception->getMessage()) ?: 'فشل استيراد منتج واحد.';
        }

        $state['processedProducts'] = (int) ($state['processedProducts'] ?? 0) + 1;
        if ($productKey) {
            $state['processedProductKeys'][] = $productKey;
            $state['processedProductKeys'] = array_values(array_unique((array) $state['processedProductKeys']));
        }

        return $state;
    }

    protected function productQueueKey(ProviderSource $providerSource, string $productId): string
    {
        return $providerSource->id . ':' . trim((string) $productId);
    }

    protected function isShamsLikeProviderSource(ProviderSource $providerSource): bool
    {
        $baseUrl = mb_strtolower((string) $providerSource->base_url);
        $driver = mb_strtolower((string) $providerSource->driver);

        return $driver === 'sawa'
            || str_contains($baseUrl, 'shams4store.com')
            || str_contains($baseUrl, 'ahminix.com')
            || str_contains(mb_strtolower((string) $providerSource->name), 'shams');
    }

    protected function providerCatalogCacheKey(ProviderSource $providerSource, int $parentId, bool $stale = false): string
    {
        $version = md5(implode('|', [
            $providerSource->id,
            $providerSource->updated_at?->timestamp ?? '',
            (string) $providerSource->catalog_endpoint,
            (string) $providerSource->base_url,
        ]));

        return ($stale ? 'provider_catalog_stale' : 'provider_catalog') . ':v28_36:' . $providerSource->id . ':' . $parentId . ':' . $version;
    }

    protected function isProviderRateLimitException(\Throwable $exception): bool
    {
        $message = mb_strtolower((string) $exception->getMessage());

        return str_contains($message, '429')
            || str_contains($message, 'rate limit')
            || str_contains($message, 'endpoint rate limit')
            || str_contains($message, 'code":127')
            || str_contains($message, 'code": 127');
    }

    protected function pauseImportForProviderRateLimit(array $state, ProviderSource $providerSource, \Throwable $exception): array
    {
        $seconds = $this->isShamsLikeProviderSource($providerSource) ? 600 : 300;
        $state['status'] = 'running';
        $state['stage'] = 'provider_rate_limited';
        $state['pauseUntil'] = time() + $seconds;
        $state['rateLimitProviderId'] = $providerSource->id;
        $state['currentItem'] = 'انتظار حد طلبات المزود';
        $state['lastMessage'] = 'مزود ' . $providerSource->name . ' أوقف الطلبات مؤقتًا بسبب كثرة المحاولات. لا تضغط الاستيراد مرة ثانية؛ سيتم المتابعة تلقائيًا بعد حوالي ' . ceil($seconds / 60) . ' دقائق.';
        $state['error'] = null;

        return $state;
    }

    protected function catalogWithRetry(ProviderSource $providerSource, int $parentId, int $attempts = 2): array
    {
        $cacheKey = $this->providerCatalogCacheKey($providerSource, $parentId);
        $staleCacheKey = $this->providerCatalogCacheKey($providerSource, $parentId, true);

        $cachedCatalog = Cache::get($cacheKey);
        if (is_array($cachedCatalog)) {
            return $cachedCatalog;
        }

        $mergedCategories = [];
        $mergedProducts = [];
        $lastCount = null;
        $lastException = null;
        $effectiveAttempts = $this->isShamsLikeProviderSource($providerSource) ? 1 : max(1, $attempts);

        for ($attempt = 1; $attempt <= $effectiveAttempts; $attempt++) {
            try {
                if ($this->isShamsLikeProviderSource($providerSource)) {
                    usleep(900000);
                }

                $catalog = $this->providerGateway->catalog($providerSource, $parentId);

                foreach ((array) ($catalog['categories'] ?? []) as $category) {
                    if (!is_array($category)) {
                        continue;
                    }
                    $key = (string) ($category['id'] ?? md5(json_encode($category)));
                    $mergedCategories[$key] = $category;
                }

                foreach ((array) ($catalog['products'] ?? []) as $product) {
                    if (!is_array($product)) {
                        continue;
                    }
                    $key = (string) ($product['id'] ?? md5(json_encode($product)));
                    $mergedProducts[$key] = $product;
                }

                $currentCount = count($mergedCategories) + count($mergedProducts);
                if ($attempt >= 2 && $currentCount === $lastCount) {
                    break;
                }

                $lastCount = $currentCount;

                if ($this->isShamsLikeProviderSource($providerSource) || ($attempt >= 2 && $currentCount > 0)) {
                    break;
                }
            } catch (\Throwable $exception) {
                $lastException = $exception;

                if ($this->isProviderRateLimitException($exception)) {
                    $staleCatalog = Cache::get($staleCacheKey);
                    if (is_array($staleCatalog)) {
                        $staleCatalog['usedStaleCache'] = true;
                        return $staleCatalog;
                    }

                    throw $exception;
                }

                if ($attempt >= $effectiveAttempts) {
                    throw $exception;
                }

                usleep(700000 * $attempt);
            }
        }

        if (empty($mergedCategories) && empty($mergedProducts) && $lastException) {
            throw $lastException;
        }

        $result = [
            'parentId' => $parentId,
            'categories' => array_values($mergedCategories),
            'products' => array_values($mergedProducts),
        ];

        $ttl = $this->isShamsLikeProviderSource($providerSource) ? now()->addMinutes(30) : now()->addMinutes(10);
        Cache::put($cacheKey, $result, $ttl);
        Cache::put($staleCacheKey, $result, now()->addHours(12));

        return $result;
    }

    protected function finalizeImportStateIfDone(array $state): array
    {
        if (empty($state['pendingCategories']) && empty($state['pendingProducts'])) {
            $state['status'] = 'completed';
            $state['stage'] = 'completed';
            $state['currentItem'] = null;
            $state['lastMessage'] = 'اكتمل الاستيراد.';
        }

        return $state;
    }

    protected function formatImportProgress(array $state): array
    {
        $discovered = max((int) ($state['discoveredProducts'] ?? $state['totalProducts'] ?? 0), (int) ($state['processedProducts'] ?? 0));
        $processed = (int) ($state['processedProducts'] ?? 0);
        $imported = (int) ($state['importedProducts'] ?? 0);
        $added = (int) ($state['addedCards'] ?? 0);
        $updated = (int) ($state['existingCards'] ?? 0);
        $failed = (int) ($state['failedProducts'] ?? 0);
        $pendingProducts = count((array) ($state['pendingProducts'] ?? []));
        $pendingCategories = count((array) ($state['pendingCategories'] ?? []));

        // Use processed/discovered for percentage, but cap at 99% until truly done
        $status = (string) ($state['status'] ?? 'running');
        if ($status === 'completed') {
            $percentage = 100;
        } elseif ($discovered > 0) {
            $percentage = min(99, (int) floor(($processed / $discovered) * 100));
        } else {
            $percentage = 0;
        }

        // Display: show imported (successful) count prominently
        $display = $discovered > 0
            ? ('تمت معالجة ' . $processed . ' من ' . $discovered . ' | أضيف ' . $added . ' | محدّث ' . $updated)
            : 'بانتظار الاكتشاف';

        return [
            'totalProducts' => $discovered,
            'discoveredProducts' => $discovered,
            'processedProducts' => $processed,
            'importedProducts' => $imported,
            'addedCards' => $added,
            'existingCards' => $updated,
            'failedProducts' => $failed,
            'pendingCategories' => $pendingCategories,
            'pendingProducts' => $pendingProducts,
            'scannedCategories' => (int) ($state['scannedCategories'] ?? 0),
            'currentItem' => $state['currentItem'] ?? null,
            'lastMessage' => $state['lastMessage'] ?? null,
            'error' => $state['error'] ?? null,
            'percentage' => $percentage,
            'display' => $display,
        ];
    }

    protected function importCacheKey(Request $request, string $jobId): string
    {
        return 'provider_import:' . ($request->user()?->id ?? 'guest') . ':' . $jobId;
    }

    protected function putImportState(Request $request, string $jobId, array $state): void
    {
        Cache::put($this->importCacheKey($request, $jobId), $state, now()->addHours(2));
    }

    protected function getImportState(Request $request, string $jobId): ?array
    {
        $state = Cache::get($this->importCacheKey($request, $jobId));
        return is_array($state) ? $state : null;
    }
}

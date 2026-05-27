<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\Card;
use App\Models\ProviderSource;
use App\Models\Section;
use App\Models\Subcategory;
use App\Services\Providers\ProviderGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CardController extends Controller
{
    public function __construct(protected ProviderGateway $providerGateway)
    {
    }

    public function index(Request $request): Response
    {
        $sectionId = $request->integer('section_id') ?: null;
        $search = trim((string) $request->query('search', ''));
        $hasFilter = filled($sectionId) || $search !== '';

        $query = Card::with(['section.parent'])
            ->select(['id', 'name', 'section_id', 'icon', 'background', 'price', 'is_active', 'sort_order'])
            ->when(! $hasFilter, fn ($builder) => $builder->whereRaw('1 = 0'))
            ->when($sectionId, fn ($builder) => $builder->where('section_id', $sectionId))
            ->when($search !== '', function ($builder) use ($search) {
                $builder->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('provider_product_id', 'like', "%{$search}%");
                });
            })
            ->orderByRaw('CASE WHEN COALESCE(sort_order, 0) > 0 THEN 0 ELSE 1 END ASC')
            ->orderByRaw('COALESCE(sort_order, 0) ASC')
            ->orderByRaw('CAST(price AS DECIMAL(30,8)) ASC')
            ->orderBy('name');

        $cards = $query
            ->paginate(25)
            ->withQueryString()
            ->through(function (Card $card) {
                $sectionName = null;
                if ($card->section) {
                    $sectionName = $card->section->name;
                    if ($card->section->parent) {
                        $sectionName = $card->section->parent->name . ' / ' . $sectionName;
                    }
                }

                return [
                    'id' => $card->id,
                    'name' => $card->name,
                    'sectionId' => (int) ($card->section_id ?? 0),
                    'image' => $card->icon ?: $card->background,
                    'price' => $card->price,
                    'is_active' => (bool) $card->is_active,
                    'section' => ['name' => $sectionName ?: 'الصفحة الرئيسية'],
                ];
            });

        return Inertia::render('Card/IndexAdmin', [
            'cards' => $cards,
            'filters' => [
                'sectionId' => $sectionId,
                'search' => $search,
                'hasFilter' => $hasFilter,
            ],
            'sections' => Section::query()
                ->withCount('cards')
                ->orderBy('section_id')
                ->orderBy('name')
                ->get(['id', 'name', 'section_id']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Card/Create', [
            'sections' => Section::all(),
            'subcategories' => Subcategory::all(),
            'providerSources' => ProviderSource::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'driver', 'supports_catalog']),
            'globalMarkupPercentage' => (float) \App\Models\Setting::get('pricing.global_markup_percentage', 0),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $card = new Card();
        $this->fillCard($card, $request, $validated);

        return $this->redirectAfterSave($card, $validated);
    }

    public function edit(Card $card): Response
    {
        return Inertia::render('Card/Edit', [
            'subcategory' => $card->subcategory,
            'card' => $card,
            'sections' => Section::all(),
            'subcategories' => Subcategory::all(),
            'providerSources' => ProviderSource::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'driver', 'supports_catalog']),
            'globalMarkupPercentage' => (float) \App\Models\Setting::get('pricing.global_markup_percentage', 0),
        ]);
    }

    public function update(Request $request, Card $card): RedirectResponse
    {
        $validated = $this->validatePayload($request, $card);
        $this->fillCard($card, $request, $validated);

        return $this->redirectAfterSave($card, $validated);
    }

    public function destroy(Card $card): RedirectResponse
    {
        FileUtils::deleteImage($card->icon);
        if ($card->background) {
            FileUtils::deleteImage($card->background);
        }

        $redirectRoute = $card->subcategory_id
            ? redirect()->route('subcategory.getCards', $card->subcategory_id)
            : ($card->section_id ? redirect()->route('sections.show', $card->section_id) : redirect()->route('sections.main'));

        $card->delete();

        return $redirectRoute;
    }


    public function quickUpdatePrice(Request $request, Card $card): JsonResponse
    {
        abort_unless($request->user()?->hasRole('Super-Admin'), 403);

        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'costPrice' => ['nullable', 'numeric', 'min:0'],
            'providerCostPrice' => ['nullable', 'numeric', 'min:0'],
        ]);

        $card->price = $validated['price'];

        if (array_key_exists('costPrice', $validated)) {
            $card->cost_price = $validated['costPrice'];
        }

        if (array_key_exists('providerCostPrice', $validated)) {
            $card->provider_cost_price = $validated['providerCostPrice'];
        }

        $card->save();

        return response()->json([
            'success' => true,
            'card' => [
                'id' => $card->id,
                'price' => $card->price,
                'cost_price' => $card->cost_price,
                'provider_cost_price' => $card->provider_cost_price,
            ],
            'message' => 'تم تحديث سعر المنتج بنجاح.',
        ]);
    }



    public function quickUpdateImage(Request $request, Card $card): JsonResponse
    {
        abort_unless($request->user()?->hasRole('Super-Admin'), 403);

        $validated = $request->validate([
            'icon' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($card->icon) {
            FileUtils::deleteImage($card->icon);
        }

        $card->icon = Storage::url($request->file('icon')->storePublicly('images/card'));
        $card->save();

        return response()->json([
            'success' => true,
            'icon' => $card->icon,
            'message' => 'تم تحديث صورة المنتج.',
        ]);
    }

    public function quickToggleAvailability(Request $request, Card $card): JsonResponse
    {
        abort_unless($request->user()?->hasRole('Super-Admin'), 403);

        $validated = $request->validate([
            'manualUnavailable' => ['required', 'boolean'],
            'availabilityNote' => ['nullable', 'string', 'max:255'],
        ]);

        $card->manual_unavailable = (bool) $validated['manualUnavailable'];
        $card->availability_note = $validated['availabilityNote'] ?? null;
        $card->save();

        return response()->json(['success' => true, 'message' => 'تم تحديث حالة توفر المنتج.']);
    }

    public function providerPreview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'providerSourceId' => ['nullable', 'integer', 'exists:provider_sources,id'],
            'providerProductId' => ['nullable', 'string', 'max:255'],
            'sawaCardId' => ['nullable', 'integer'],
        ]);

        $providerSource = $this->resolveProviderSource($validated);
        $productId = (string) ($validated['providerProductId'] ?? $validated['sawaCardId'] ?? '');

        if (! $providerSource || $productId === '') {
            return response()->json(['message' => 'حدد المزود ومعرّف المنتج أولًا.'], 422);
        }

        try {
            $result = $this->providerGateway->preview($providerSource, $productId);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'تعذر جلب بيانات المنتج من المزود.'], 422);
        }

        $normalized = $result['normalized'] ?? [];

        return response()->json([
            'data' => array_merge($normalized, [
                'priceAdjustmentPercentage' => 0,
                'profitPercentage' => 0,
            ]),
            'raw' => $result['raw'] ?? null,
            'provider' => [
                'id' => $providerSource->id,
                'name' => $providerSource->name,
                'driver' => $providerSource->driver,
            ],
        ]);
    }

    public function providerCatalog(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'providerSourceId' => ['nullable', 'integer', 'exists:provider_sources,id'],
            'parentId' => ['nullable', 'integer', 'min:0'],
        ]);

        $providerSource = $this->resolveProviderSource($validated);

        if (! $providerSource) {
            return response()->json(['message' => 'تعذر تحديد المزود المطلوب.'], 422);
        }

        try {
            $catalog = $this->providerGateway->catalog($providerSource, (int) ($validated['parentId'] ?? 0));
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'تعذر جلب قائمة المنتجات من المزود.'], 422);
        }

        return response()->json(['data' => $catalog]);
    }

    protected function resolveProviderSource(array $validated): ?ProviderSource
    {
        if (! empty($validated['providerSourceId'])) {
            return ProviderSource::query()->where('is_active', true)->find($validated['providerSourceId']);
        }

        return ProviderSource::query()->where('slug', 'sawa5card')->where('is_active', true)->first();
    }

    protected function validatePayload(Request $request, ?Card $card = null): array
    {
        return $request->validate([
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'subcategoryId' => ['nullable', 'integer', 'exists:subcategories,id'],
            'providerSourceId' => ['nullable', 'integer', 'exists:provider_sources,id'],
            'name' => ['required', 'string', 'max:255'],
            'icon' => [Rule::requiredIf(! $card), 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'price' => ['required', 'numeric', 'min:0'],
            'costPrice' => ['nullable', 'numeric', 'min:0'],
            'providerCostPrice' => ['nullable', 'numeric', 'min:0'],
            'priceAdjustmentPercentage' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'profitPercentage' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'isActive' => ['required', 'boolean'],
            'manualUnavailable' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:-999999', 'max:999999'],
            'availabilityNote' => ['nullable', 'string', 'max:255'],
            'metaTitle' => ['nullable', 'string', 'max:255'],
            'metaDescription' => ['nullable', 'string', 'max:500'],
            'sawaCardId' => ['nullable', 'string', 'max:255'],
            'providerProductId' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'minAmount' => ['nullable', 'integer', 'min:0'],
            'maxAmount' => ['nullable', 'integer', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0', 'max:100'],
            'backgroundImage' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'requiresPlayerId' => ['required', 'boolean'],
            'playerIdLabel' => ['nullable', 'string', 'max:255'],
            'quantityLabel' => ['nullable', 'string', 'max:255'],
            'amountMode' => ['required', 'string', 'in:quantity,custom_value'],
            'deliveryMode' => ['required', 'string', 'in:api_codes,api_topup,manual_review'],
            'providerProductType' => ['nullable', 'string', Rule::in(['package', 'amount', 'manual', ''])],
            'providerQtyValues' => ['nullable'],
            'providerParams' => ['nullable'],
            'purchaseFlow' => ['required', 'string', 'in:player_category,codes_quantity,player_custom_value,player_and_server,direct_purchase'],
            'requiresSecondaryPlayerId' => ['required', 'boolean'],
            'secondaryPlayerIdLabel' => ['nullable', 'string', 'max:255'],
            'optionPrices' => ['nullable'],
            'optionCosts' => ['nullable'],
            'providerOptionProductIds' => ['nullable'],
        ]);
    }

    protected function fillCard(Card $card, Request $request, array $validated): void
    {
        $minAmount = (int) ($validated['minAmount'] ?? 1);
        $maxAmount = (int) ($validated['maxAmount'] ?? $minAmount);

        $card->section_id = $validated['sectionId'] ?? $card->section_id ?? 0;
        $card->sort_order = (int) ($validated['sortOrder'] ?? $card->sort_order ?? 0);
        $card->subcategory_id = $validated['subcategoryId'] ?? $card->subcategory_id;
        $card->provider_source_id = $validated['providerSourceId'] ?? null;
        $card->name = $validated['name'];
        $card->price = $validated['price'];
        $card->cost_price = $validated['costPrice'] ?? ($validated['providerCostPrice'] ?? 0);
        $card->provider_cost_price = $validated['providerCostPrice'] ?? null;
        $card->price_adjustment_percentage = $validated['priceAdjustmentPercentage'] ?? 0;
        $card->profit_percentage = $validated['profitPercentage'] ?? (float) \App\Models\Setting::get('pricing.global_markup_percentage', 0);
        $card->is_active = (bool) ($validated['isActive'] ?? true);
        $card->manual_unavailable = (bool) ($validated['manualUnavailable'] ?? false);
        $card->availability_note = $validated['availabilityNote'] ?? null;
        $card->meta_title = $validated['metaTitle'] ?? null;
        $card->meta_description = $validated['metaDescription'] ?? null;
        $providerProductId = (string) ($validated['providerProductId'] ?? $validated['sawaCardId'] ?? '');
        $card->provider_product_id = filled($providerProductId) ? $providerProductId : null;
        $card->sawaCardId = filled($providerProductId) ? $providerProductId : '0';
        $card->description = $validated['description'] ?? null;
        $card->minAmount = $minAmount;
        $card->maxAmount = max($maxAmount, $minAmount);
        $card->discount = $validated['discount'] ?? 0;
        $card->requires_player_id = (bool) $validated['requiresPlayerId'];
        $card->player_id_label = $validated['playerIdLabel'] ?? 'معرّف اللاعب';
        $card->quantity_label = $validated['quantityLabel'] ?? 'الكمية';
        $card->amount_mode = $validated['amountMode'];
        $card->delivery_mode = $validated['deliveryMode'];
        $card->provider_product_type = $validated['providerProductType'] ?? ($card->provider_product_id ? 'package' : 'manual');
        $card->provider_qty_values = $this->normalizeJsonInput($request->input('providerQtyValues'));
        $card->provider_params = $this->normalizeJsonInput($request->input('providerParams'));
        $card->purchase_flow = $validated['purchaseFlow'] ?? $this->inferPurchaseFlowFromInputs($validated, $card);
        $card->requires_secondary_player_id = (bool) ($validated['requiresSecondaryPlayerId'] ?? false);
        $card->secondary_player_id_label = $validated['secondaryPlayerIdLabel'] ?? 'المعرّف الثاني / السيرفر';
        $card->option_prices = $this->normalizeOptionMap($request->input('optionPrices'));
        $card->option_costs = $this->normalizeOptionMap($request->input('optionCosts'));
        $card->provider_option_product_ids = $this->normalizeOptionMap($request->input('providerOptionProductIds'));

        $iconFile = $request->file('icon');
        if ($iconFile) {
            if ($card->icon) {
                FileUtils::deleteImage($card->icon);
            }
            $card->icon = Storage::url($iconFile->storePublicly('images/card'));
        }

        $backgroundFile = $request->file('backgroundImage');
        if ($backgroundFile) {
            if ($card->background) {
                FileUtils::deleteImage($card->background);
            }
            $card->background = Storage::url($backgroundFile->storePublicly('images/card'));
        }

        $card->save();
    }

    protected function normalizeJsonInput(mixed $value): mixed
    {
        if (is_array($value) || $value === null || $value === '') {
            return $value ?: null;
        }

        $decoded = json_decode((string) $value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    protected function inferPurchaseFlowFromInputs(array $validated, Card $card): string
    {
        if (! empty($validated['requiresSecondaryPlayerId'])) {
            return 'player_and_server';
        }

        if (($validated['amountMode'] ?? $card->amount_mode ?? 'quantity') === 'custom_value') {
            return 'player_custom_value';
        }

        if (! empty($validated['requiresPlayerId'])) {
            return 'player_category';
        }

        $qtyValues = $card->provider_qty_values ?? $this->normalizeJsonInput(request()->input('providerQtyValues'));
        if (is_array($qtyValues) && array_is_list($qtyValues) && count($qtyValues) > 1) {
            return 'codes_quantity';
        }

        return 'direct_purchase';
    }

    protected function normalizeOptionMap(mixed $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode((string) $value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        $lines = preg_split('/\r\n|\r|\n/', trim((string) $value));
        $result = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || ! str_contains($line, '=')) {
                continue;
            }
            [$key, $price] = array_map('trim', explode('=', $line, 2));
            if ($key !== '' && $price !== '') {
                $result[(string) $key] = is_numeric($price) ? (float) $price : $price;
            }
        }

        return $result ?: null;
    }


    public function quickUpdateSort(Request $request, Card $card): RedirectResponse
    {
        $validated = $request->validate([
            'sortOrder' => ['required', 'integer', 'min:-999999', 'max:999999'],
        ]);

        $card->sort_order = (int) $validated['sortOrder'];
        $card->save();

        return back()->with('success', 'تم تحديث ترتيب المنتج.');
    }

    public function quickUpdatePricing(Request $request, Card $card): RedirectResponse
    {
        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'costPrice' => ['nullable', 'numeric', 'min:0'],
        ]);

        $card->price = $validated['price'];
        if (array_key_exists('costPrice', $validated)) {
            $card->cost_price = $validated['costPrice'];
        }
        $card->save();

        return back()->with('success', 'تم تحديث سعر المنتج بسرعة.');
    }

    public function moveSection(Request $request, Card $card): RedirectResponse
    {
        $validated = $request->validate([
            'sectionId' => ['nullable', 'integer', 'exists:sections,id'],
            'root' => ['nullable', 'boolean'],
        ]);

        $moveToRoot = (bool) ($validated['root'] ?? false);
        $targetSection = null;

        if (! $moveToRoot) {
            if (empty($validated['sectionId'])) {
                throw ValidationException::withMessages([
                    'sectionId' => 'اختر القسم الجديد أو اختر النقل إلى الصفحة الرئيسية.',
                ]);
            }

            $targetSection = Section::query()->findOrFail((int) $validated['sectionId']);
        }

        $newSectionId = $moveToRoot ? 0 : (int) $targetSection->id;
        $oldSectionId = (int) ($card->section_id ?? 0);

        if ($oldSectionId === $newSectionId) {
            return back()->with('success', 'المنتج موجود أصلًا داخل هذا المكان.');
        }

        $card->section_id = $newSectionId;
        // نقل المنتج لقسم جديد يعني أنه لم يعد تابعًا لأي subcategory قديمة.
        $card->subcategory_id = null;
        $card->save();

        $destination = $moveToRoot ? 'الصفحة الرئيسية' : $targetSection->name;

        return back()->with('success', 'تم نقل المنتج إلى: ' . $destination);
    }

    protected function redirectAfterSave(Card $card, array $validated): RedirectResponse
    {
        if (! empty($validated['subcategoryId'] ?? $card->subcategory_id)) {
            return redirect()->route('subcategory.getCards', $validated['subcategoryId'] ?? $card->subcategory_id);
        }

        if (! empty($validated['sectionId'] ?? $card->section_id)) {
            return redirect()->route('sections.show', $validated['sectionId'] ?? $card->section_id);
        }

        return redirect()->route('sections.main');
    }
}

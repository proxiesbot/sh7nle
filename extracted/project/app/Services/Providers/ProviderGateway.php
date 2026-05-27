<?php

namespace App\Services\Providers;

use App\Models\ProviderSource;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProviderGateway
{
    protected function isSwGamesProvider(ProviderSource $providerSource): bool
    {
        $baseUrl = mb_strtolower((string) $providerSource->base_url);

        return $providerSource->driver === 'swgames'
            || str_contains($baseUrl, 'sw-games.net/api/fastapi');
    }

    protected function isShamsLikeProvider(ProviderSource $providerSource): bool
    {
        $baseUrl = mb_strtolower((string) $providerSource->base_url);

        return $providerSource->driver === 'sawa'
            || str_contains($baseUrl, 'shams4store.com')
            || str_contains($baseUrl, 'ahminix.com');
    }

    public function preview(ProviderSource $providerSource, string $productId): array
    {
        if ($this->isSwGamesProvider($providerSource)) {
            return $this->previewSwGames($providerSource, $productId);
        }

        return $this->isShamsLikeProvider($providerSource)
            ? $this->previewSawa($providerSource, $productId)
            : $this->previewGeneric($providerSource, $productId);
    }

    public function catalog(ProviderSource $providerSource, int $parentId = 0): array
    {
        if ($this->isSwGamesProvider($providerSource)) {
            return $this->catalogSwGames($providerSource, $parentId);
        }

        return $this->isShamsLikeProvider($providerSource)
            ? $this->catalogSawa($providerSource, $parentId)
            : $this->catalogGeneric($providerSource, $parentId);
    }

    public function order(ProviderSource $providerSource, string $productId, array $payload): array
    {
        if ($this->isSwGamesProvider($providerSource)) {
            return $this->orderSwGames($providerSource, $productId, $payload);
        }

        return $this->isShamsLikeProvider($providerSource)
            ? $this->orderSawa($providerSource, $productId, $payload)
            : $this->orderGeneric($providerSource, $productId, $payload);
    }

    public function check(ProviderSource $providerSource, array $orderIdentifiers, bool $useUuid = false): array
    {
        if ($this->isSwGamesProvider($providerSource)) {
            return $this->checkSwGames($providerSource, $orderIdentifiers);
        }

        return $this->isShamsLikeProvider($providerSource)
            ? $this->checkSawa($providerSource, $orderIdentifiers, $useUuid)
            : $this->checkGeneric($providerSource, $orderIdentifiers, $useUuid);
    }


protected function previewSwGames(ProviderSource $providerSource, string $productId): array
{
    $products = $this->fetchSwGamesProducts($providerSource);
    $item = collect($products)->first(fn ($entry) => (string) ($entry['id'] ?? '') === (string) $productId);

    if (! is_array($item)) {
        throw new \RuntimeException('تعذر جلب بيانات المنتج من SW Games.');
    }

    return [
        'normalized' => $this->normalizeSwGamesProduct($item),
        'raw' => $item,
    ];
}


protected function catalogSwGames(ProviderSource $providerSource, int $parentId = 0): array
{
    $products = collect($this->fetchSwGamesProducts($providerSource))
        ->filter(fn ($item) => is_array($item) && trim((string) ($item['id'] ?? '')) !== '')
        ->map(function ($item) {
            $item = (array) $item;
            $trail = $this->swGamesLocationTrail($item);
            $item['__sw_location_trail'] = $trail;
            $item['__sw_location_id'] = $this->swGamesPathId($trail);

            return $item;
        })
        ->filter(fn ($item) => ! empty($item['__sw_location_trail']))
        ->values();

    $currentTrail = $parentId > 0 ? $this->swGamesFindTrailByPathId($products, $parentId) : [];

    if ($parentId > 0 && empty($currentTrail)) {
        return [
            'parentId' => (int) $parentId,
            'categories' => [],
            'products' => [],
        ];
    }

    $currentDepth = count($currentTrail);
    $categoryMap = [];
    $directProducts = [];

    foreach ($products as $item) {
        $trail = (array) ($item['__sw_location_trail'] ?? []);
        if (! $this->swGamesTrailStartsWith($trail, $currentTrail)) {
            continue;
        }

        $remainder = array_slice($trail, $currentDepth);
        if (! empty($remainder)) {
            $childTrail = array_merge($currentTrail, [$remainder[0]]);
            $key = implode(' / ', $childTrail);

            if (! isset($categoryMap[$key])) {
                $categoryMap[$key] = [
                    'id' => $this->swGamesPathId($childTrail),
                    'name' => (string) $remainder[0],
                    'parentId' => (int) $parentId,
                    'image' => $item['image'] ?? null,
                    'productsCount' => 0,
                ];
            }

            $categoryMap[$key]['productsCount']++;
            continue;
        }

        $directProducts[] = $item;
    }

    $categories = collect($categoryMap)
        ->values()
        ->sortBy(fn ($category) => mb_strtolower((string) ($category['name'] ?? '')))
        ->values()
        ->all();

    return [
        'parentId' => (int) $parentId,
        'categories' => $categories,
        'products' => collect($directProducts)
            ->map(fn ($item) => $this->normalizeSwGamesProduct((array) $item))
            ->values()
            ->all(),
    ];
}

protected function swGamesLocationTrail(array $item): array
{
    // SW Games API returns products as a flat list. The visible categories live on
    // the public SW Games website. We first map the API product/service name to
    // the website tree, so roots become real roots like Chat/Games/Balance instead
    // of fake roots such as PANDA CHAT or HaloStar.
    $mappedTrail = $this->swGamesWebMappedTrail($item);
    if (! empty($mappedTrail)) {
        return $mappedTrail;
    }

    $productName = trim((string) ($item['name'] ?? ''));
    $explicitPathCandidates = [
        $item['categoryPath'] ?? null,
        $item['category_path'] ?? null,
        $item['categoryFullPath'] ?? null,
        $item['category_full_path'] ?? null,
        $item['fullPath'] ?? null,
        $item['full_path'] ?? null,
        $item['breadcrumb'] ?? null,
        $item['breadcrumbs'] ?? null,
        $item['path'] ?? null,
        $item['sectionPath'] ?? null,
        $item['section_path'] ?? null,
        $item['locationPath'] ?? null,
        $item['location_path'] ?? null,
        data_get($item, 'category.path'),
        data_get($item, 'game.path'),
        data_get($item, 'service.path'),
    ];

    foreach ($explicitPathCandidates as $candidate) {
        $trail = $this->swGamesTrailFromValue($candidate);
        if (! empty($trail)) {
            return $this->cleanSwGamesTrail($trail, $productName);
        }
    }

    $childName = $this->swGamesProductGroupName($item);

    return $childName !== ''
        ? ['غير مصنف من SW Games', $childName]
        : ['غير مصنف من SW Games'];
}

protected function swGamesWebMappedTrail(array $item): array
{
    $map = $this->fetchSwGamesWebCategoryMap();
    if (empty($map)) {
        return [];
    }

    $candidateNames = $this->swGamesProductNameCandidates($item);
    if (empty($candidateNames)) {
        return [];
    }

    $index = [];
    foreach ($map as $rootName => $children) {
        foreach ((array) $children as $childName) {
            $childName = trim((string) $childName);
            if ($childName === '') {
                continue;
            }

            $index[] = [
                'root' => (string) $rootName,
                'child' => $childName,
                'key' => $this->swGamesComparableKey($childName),
                'length' => mb_strlen($this->swGamesComparableKey($childName)),
            ];
        }
    }

    usort($index, fn ($a, $b) => ($b['length'] <=> $a['length']) ?: strcmp($a['child'], $b['child']));

    $candidateKeys = collect($candidateNames)
        ->map(fn ($name) => $this->swGamesComparableKey((string) $name))
        ->filter()
        ->unique()
        ->values()
        ->all();

    foreach ($candidateKeys as $candidateKey) {
        foreach ($index as $entry) {
            if ($candidateKey === $entry['key']) {
                return $this->cleanSwGamesTrail([$entry['root'], $entry['child']], (string) ($item['name'] ?? ''));
            }
        }
    }

    foreach ($candidateKeys as $candidateKey) {
        foreach ($index as $entry) {
            if ($entry['length'] >= 4 && str_contains($candidateKey, $entry['key'])) {
                return $this->cleanSwGamesTrail([$entry['root'], $entry['child']], (string) ($item['name'] ?? ''));
            }
        }
    }

    return [];
}

protected function fetchSwGamesWebCategoryMap(): array
{
    return Cache::remember('swgames_web_category_map:v3', now()->addHours(12), function () {
        $roots = $this->swGamesWebRootCategories();
        $map = [];

        foreach ($roots as $slug => $rootName) {
            $children = [];

            try {
                $url = 'https://sw-games.net/category/' . $slug;
                $response = Http::timeout(12)
                    ->withHeaders(['User-Agent' => 'Mozilla/5.0 Sh7nle Import Bot'])
                    ->get($url);

                if ($response->successful()) {
                    $children = $this->extractSwGamesWebChildrenFromHtml((string) $response->body());
                }
            } catch (\Throwable $exception) {
                report($exception);
            }

            $fallback = $this->fallbackSwGamesWebChildren($rootName);
            $children = collect(array_merge($children, $fallback))
                ->map(fn ($name) => $this->cleanSwGamesWebChildName((string) $name))
                ->filter()
                ->unique(fn ($name) => $this->swGamesComparableKey((string) $name))
                ->sortBy(fn ($name) => mb_strtolower((string) $name))
                ->values()
                ->all();

            if (! empty($children)) {
                $map[$rootName] = $children;
            }
        }

        return $map;
    });
}

protected function swGamesWebRootCategories(): array
{
    return [
        'games' => 'Games',
        'chat' => 'Chat',
        'online-payments' => 'Online Payments',
        'balance' => 'Balance',
        'card-pin' => 'Card PIN',
        'dsl-syria' => 'DSL SYRIA',
        'subscriptions' => 'Subscriptions',
        'social-media' => 'Social Media',
        '%D9%85%D8%AF%D9%81%D9%88%D8%B9%D8%A7%D8%AA-%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A%D8%A9' => 'مدفوعات الكترونية',
    ];
}

protected function extractSwGamesWebChildrenFromHtml(string $html): array
{
    $children = [];
    preg_match_all('/<a\b[^>]*href=["\']([^"\']*(?:\/game\/|\/product\/|\/item\/)[^"\']*)["\'][^>]*>(.*?)<\/a>/isu', $html, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        $name = $this->cleanSwGamesWebChildName((string) ($match[2] ?? ''));
        if ($name !== null) {
            $children[] = $name;
        }
    }

    return $children;
}

protected function cleanSwGamesWebChildName(string $value): ?string
{
    $name = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $name = preg_replace('/\s+/u', ' ', trim((string) $name));

    if ($name === '') {
        return null;
    }

    $badFragments = [
        '${',
        'product.name',
        'data.products.length',
        'عرض كل المنتجات',
        'show all products',
        'all products',
    ];

    $lower = mb_strtolower($name);
    foreach ($badFragments as $fragment) {
        if (str_contains($lower, mb_strtolower($fragment))) {
            return null;
        }
    }

    if (mb_strlen($name) > 80) {
        return null;
    }

    return $name;
}

protected function fallbackSwGamesWebChildren(string $rootName): array
{
    return match ($rootName) {
        'Chat' => [
            'PANDA CHAT', 'HaloStar', 'Waki', 'Waho', 'BigoLive', 'PoppoLive', 'SoulChill', 'Yoho', 'YoParty', 'YOHOO STAR', 'YallaLive', 'YooY', 'Yoyo', 'Yolo', 'Yaahlan', 'Likee', 'Mico', 'TopTop', 'Ume', 'UpLive', 'Vostar', 'WAAW CHAT', 'WAHA CHAT', 'WAHDA CHAT', 'WASLA', 'WIKOO', 'WillChill', 'Wyak', 'Xena', 'YULA CHAT', 'Yayya', 'Yo2', 'Yoki',
        ],
        'Games' => [
            'PUBG', 'Pubg', 'FreeFire', 'Free Fire', 'Jawaker', 'Roblox', 'Fortnite', 'Valorant', 'League of Legends', 'NidaAlharb', 'Nintendo', 'PlayStaion', 'Steam',
        ],
        'Online Payments' => [
            'BNB', 'Binance Gift Card', 'Paypal', 'Perfect Money', 'ShamCash $', 'ShamCash S.P', 'TRX', 'USDT(BEP20)', 'USDT(Trc20)', 'USDT',
        ],
        'Balance' => [
            'Cash(SYR/MTN)', 'MTN UNITS', 'SYRIATEL UNITS', 'جملة MTN', 'جملة SYR',
        ],
        'Card PIN' => [
            'Anghami Plus', 'AppleAccount USA حسابات ابل', 'ExpressVPN', 'Fortnite 5000 V-Bucks Card', 'FreeFire Codes', 'GooglePlay', 'Itunes', 'League of Legends (Riot Cash)', 'Likee PIN', 'NetFlix', 'NidaAlharb', 'Nintendo', 'NordVPN', 'PlayStaion', 'Pubg Codes', 'Roblox', 'Shahid', 'Steam', 'SurfsharkVPN', 'VISA(USA ONLY)', 'Valorant (Riot Cash)', 'Visa Link',
        ],
        'DSL SYRIA' => [
            'MTN', 'MTS الألفية', 'الجمعية العلمية السورية', 'الكم', 'امنية', 'امواج', 'اية', 'اينت', 'برونت', 'بطاقات', 'تكامل', 'دنيا', 'رن نت', 'زاد نت', 'سما نت', 'سوا نت', 'فيو نت', 'لاي نت', 'ليزر', 'ليما', 'ناس', 'هايبر نت', 'هايفاي', 'يارا',
        ],
        'Subscriptions' => ['Shahid Account', 'Telegram Premium', 'Telegram Stars'],
        'مدفوعات الكترونية' => ['السورية للاتصالات'],
        default => [],
    };
}

protected function swGamesProductNameCandidates(array $item): array
{
    $fields = [
        $item['gameName'] ?? null,
        $item['game_name'] ?? null,
        $item['serviceName'] ?? null,
        $item['service_name'] ?? null,
        $item['categoryName'] ?? null,
        $item['category_name'] ?? null,
        $item['parentName'] ?? null,
        $item['parent_name'] ?? null,
        $item['groupName'] ?? null,
        $item['group_name'] ?? null,
        data_get($item, 'game.name'),
        data_get($item, 'service.name'),
        data_get($item, 'category.name'),
        $item['name'] ?? null,
    ];

    return collect($fields)
        ->map(fn ($value) => $this->swGamesNameFromValue($value))
        ->filter()
        ->unique(fn ($name) => $this->swGamesComparableKey((string) $name))
        ->values()
        ->all();
}

protected function swGamesProductGroupName(array $item): string
{
    return (string) (collect($this->swGamesProductNameCandidates($item))->first() ?: 'منتجات SW Games');
}

protected function swGamesTrailFromValue($value): array
{
    if (blank($value)) {
        return [];
    }

    if (is_array($value)) {
        $items = array_is_list($value) ? $value : [$value];

        return collect($items)
            ->map(fn ($item) => $this->swGamesNameFromValue($item))
            ->filter()
            ->values()
            ->all();
    }

    return collect(preg_split('/\s*(?:\/|>|-|→|»|\|)\s*/u', (string) $value))
        ->map(fn ($part) => trim((string) $part))
        ->filter()
        ->values()
        ->all();
}

protected function swGamesNameFromValue($value): ?string
{
    if (is_array($value)) {
        foreach (['name', 'title', 'label', 'text', 'value', 'categoryName', 'gameName', 'serviceName'] as $field) {
            $name = trim((string) ($value[$field] ?? ''));
            if ($name !== '') {
                return $name;
            }
        }

        return null;
    }

    $name = trim((string) $value);

    return $name !== '' ? $name : null;
}

protected function cleanSwGamesTrail(array $trail, string $productName = ''): array
{
    $clean = [];
    $previous = null;

    foreach ($trail as $name) {
        $name = $this->normalizeSwGamesSectionName($name);
        if ($name === null) {
            continue;
        }

        $comparable = $this->normalizeSwGamesComparable($name);
        if ($previous !== null && $previous === $comparable) {
            continue;
        }

        $clean[] = $name;
        $previous = $comparable;
    }

    if ($productName !== '' && count($clean) > 1) {
        $last = $this->normalizeSwGamesComparable((string) end($clean));
        $product = $this->normalizeSwGamesComparable($productName);
        if ($last === $product) {
            array_pop($clean);
        }
    }

    return array_values($clean);
}

protected function normalizeSwGamesSectionName($value): ?string
{
    $name = preg_replace('/\s+/u', ' ', trim((string) $value));
    if ($name === '') {
        return null;
    }

    $comparable = $this->normalizeSwGamesComparable($name);

    $pureDeliveryLabels = [
        'تطبيقات مباشرة',
        'التطبيقات مباشرة',
        'التطبيقات المباشرة',
        'برامج مباشرة',
        'برامج فورية',
        'العاب مباشرة',
        'ألعاب مباشرة',
        'الالعاب المباشرة',
        'الألعاب المباشرة',
        'بطاقات مباشرة',
        'البطاقات المباشرة',
        'كروت مباشرة',
        'خدمات مباشرة',
        'الخدمات المباشرة',
        'مباشر',
        'مباشرة',
        'فوري',
        'فورية',
        'اوتو',
        'أوتو',
        'اتوماتيك',
        'شحن مباشر',
        'شحن فوري',
        'direct apps',
        'direct applications',
        'applications direct',
        'apps direct',
        'games direct',
        'direct games',
        'cards direct',
        'direct cards',
        'services direct',
        'direct services',
        'direct',
        'instant',
        'auto',
        'automatic',
        'topup',
        'top up',
        'recharge',
    ];

    $pureDeliveryLabels = collect($pureDeliveryLabels)
        ->map(fn ($label) => $this->normalizeSwGamesComparable((string) $label))
        ->all();

    if (in_array($comparable, $pureDeliveryLabels, true)) {
        return null;
    }

    $stripped = preg_replace('/(?:^|\s)(?:مباشر(?:ة)?|فوري(?:ة)?|اوتو|أوتو|اتوماتيك)(?:\s|$)/u', ' ', $name);
    $stripped = preg_replace('/\b(?:direct|instant|auto|automatic|top\s*up|topup|recharge)\b/iu', ' ', (string) $stripped);
    $stripped = preg_replace('/\s+/u', ' ', trim((string) $stripped));

    if ($stripped === '') {
        return null;
    }

    return $stripped;
}

protected function normalizeSwGamesComparable(string $value): string
{
    $value = preg_replace('/\s+/u', ' ', trim($value));
    $value = str_replace(['إ', 'أ', 'آ'], 'ا', $value);
    $value = str_replace('ى', 'ي', $value);
    $value = str_replace('ة', 'ه', $value);

    return mb_strtolower($value);
}

protected function swGamesComparableKey(string $value): string
{
    $value = $this->normalizeSwGamesComparable($value);
    return preg_replace('/[^\p{L}\p{N}]+/u', '', $value) ?: '';
}

protected function swGamesFindTrailByPathId($products, int $pathId): array
{
    foreach ($products as $item) {
        $trail = (array) ($item['__sw_location_trail'] ?? []);
        for ($depth = 1; $depth <= count($trail); $depth++) {
            $prefix = array_slice($trail, 0, $depth);
            if ($this->swGamesPathId($prefix) === $pathId) {
                return $prefix;
            }
        }
    }

    return [];
}

protected function swGamesTrailStartsWith(array $trail, array $prefix): bool
{
    if (count($prefix) > count($trail)) {
        return false;
    }

    foreach ($prefix as $index => $name) {
        if ($this->swGamesComparableKey((string) ($trail[$index] ?? '')) !== $this->swGamesComparableKey((string) $name)) {
            return false;
        }
    }

    return true;
}

protected function swGamesCategoryName(array $item): string
{
    $trail = $this->swGamesLocationTrail($item);

    return trim((string) end($trail)) ?: 'SW Games';
}

protected function swGamesCategoryPath(array $item): string
{
    return implode(' / ', $this->swGamesLocationTrail($item));
}

protected function swGamesPathId(array $trail): int
{
    $trail = $this->cleanSwGamesTrail($trail);
    $path = mb_strtolower(implode('>', $trail));
    $hash = sprintf('%u', crc32('swgames:path:' . $path));

    return max(1, (int) ($hash % 2000000000));
}

protected function swGamesCategoryId(array $item): int
{
    return $this->swGamesPathId($this->swGamesLocationTrail($item));
}

protected function fetchSwGamesProducts(ProviderSource $providerSource): array
{
    $endpoint = $this->resolveUrl($providerSource, $providerSource->product_endpoint ?: '/products');
    $cacheKey = 'swgames_products:' . $providerSource->id . ':' . md5($endpoint . '|' . (string) $providerSource->updated_at);

    return Cache::remember($cacheKey, now()->addMinutes(12), function () use ($providerSource, $endpoint) {
        $allProducts = [];
        $page = 1;
        $maxPages = 80;

        do {
            $response = $this->request($providerSource)->get($endpoint, $page > 1 ? ['page' => $page] : []);
            $json = $response->json();
            $hasError = (bool) ($json['error'] ?? false);

            if (! $response->successful() || $hasError) {
                throw new \RuntimeException($this->extractErrorMessage($json) ?: 'تعذر جلب قائمة المنتجات من SW Games.');
            }

            foreach ($this->extractSwGamesProductsFromPayload(is_array($json) ? $json : []) as $product) {
                if (is_array($product)) {
                    $allProducts[(string) ($product['id'] ?? md5(json_encode($product)))] = $product;
                }
            }

            $nextPage = data_get($json, 'data.next_page_url')
                || data_get($json, 'next_page_url')
                || data_get($json, 'links.next')
                || ((int) data_get($json, 'data.current_page', $page) < (int) data_get($json, 'data.last_page', $page));

            $page++;
        } while ($nextPage && $page <= $maxPages);

        return array_values($allProducts);
    });
}

protected function extractSwGamesProductsFromPayload(array $json): array
{
    $candidates = [
        data_get($json, 'data.products'),
        data_get($json, 'products'),
        data_get($json, 'data.data'),
        data_get($json, 'data'),
    ];

    foreach ($candidates as $candidate) {
        if (is_array($candidate) && array_is_list($candidate)) {
            return $candidate;
        }
    }

    return [];
}

protected function orderSwGames(ProviderSource $providerSource, string $productId, array $payload): array
{
    $rawProduct = collect($this->fetchSwGamesProducts($providerSource))
        ->first(fn ($entry) => (string) ($entry['id'] ?? '') === (string) $productId);

    if (! is_array($rawProduct)) {
        throw new \RuntimeException('المنتج المطلوب غير موجود في SW Games.');
    }

    $dynamicFields = collect((array) ($rawProduct['daynamicFields'] ?? []))
        ->filter(fn ($field) => is_array($field))
        ->values();

    $query = [
        'qty' => max(1, (int) ($payload['qty'] ?? 1)),
        'uuid' => (string) ($payload['order_uuid'] ?? Str::uuid()),
    ];

    if ($dynamicFields->isNotEmpty()) {
        $firstField = (array) $dynamicFields->get(0, []);
        $firstName = trim((string) ($firstField['name'] ?? 'Player_ID'));
        $query[$firstName] = (string) ($payload['playerId'] ?? '');
    }

    if ($dynamicFields->count() > 1) {
        $secondField = (array) $dynamicFields->get(1, []);
        $secondName = trim((string) ($secondField['name'] ?? 'Player_ID_2'));
        $query[$secondName] = (string) ($payload['playerId2'] ?? '');
    }

    $response = $this->request($providerSource)->get(
        $this->resolveUrl($providerSource, $providerSource->order_endpoint, ['id' => $productId]),
        $query
    );

    $json = $response->json();
    $hasError = (bool) ($json['error'] ?? false);
    $data = is_array($json) ? ($json['data'] ?? null) : null;

    if (! $response->successful() || $hasError || ! is_array($data)) {
        throw new \RuntimeException($this->extractErrorMessage($json) ?: 'تعذر إتمام الطلب من SW Games.');
    }

    return [
        'order_id' => (string) ($data['order_number'] ?? $query['uuid']),
        'status' => (string) ($data['status'] ?? 'pending'),
        'amount' => (float) ($data['amount'] ?? 0),
        'created_at' => $data['created_at'] ?? null,
        'notes' => $data['notes'] ?? null,
    ];
}

protected function checkSwGames(ProviderSource $providerSource, array $orderIdentifiers): array
{
    $ids = collect($orderIdentifiers)
        ->map(fn ($id) => trim((string) $id))
        ->filter()
        ->values();

    if ($ids->isEmpty()) {
        return [];
    }

    $response = $this->request($providerSource)->get(
        $this->resolveUrl($providerSource, $providerSource->check_endpoint ?: '/checkorders'),
        ['order_ids' => $ids->implode(',')]
    );

    $json = $response->json();
    $hasError = (bool) ($json['error'] ?? false);
    $orders = (array) data_get($json, 'data.orders', []);

    if (! $response->successful() || $hasError) {
        throw new \RuntimeException($this->extractErrorMessage($json) ?: 'تعذر فحص الطلبات من SW Games.');
    }

    return collect($orders)->map(function ($order) {
        $order = (array) $order;

        return [
            'order_id' => (string) ($order['order_number'] ?? ''),
            'status' => (string) ($order['status'] ?? ''),
            'price' => (float) ($order['price'] ?? 0),
            'created_at' => $order['created_at'] ?? null,
            'notes' => null,
            'gamer_data' => (array) ($order['gamer_data'] ?? []),
        ];
    })->values()->all();
}

protected function normalizeSwGamesProduct(array $item): array
{
    $dynamicFields = collect((array) ($item['daynamicFields'] ?? []))
        ->filter(fn ($field) => is_array($field))
        ->values();

    $params = $dynamicFields
        ->map(fn ($field) => trim((string) ($field['label'] ?? $field['name'] ?? '')))
        ->filter()
        ->values()
        ->all();

    $price = (float) ($item['price'] ?? 0);
    $minCount = max(1, (int) ($item['minCount'] ?? 1));
    $maxCount = max($minCount, (int) ($item['maxCount'] ?? $minCount));

    return [
        'id' => trim((string) ($item['id'] ?? '')),
        'name' => trim((string) ($item['name'] ?? 'منتج')),
        'categoryName' => $this->swGamesCategoryName($item),
        'categoryPath' => $this->swGamesCategoryPath($item),
        'categoryNames' => $this->swGamesLocationTrail($item),
        'price' => $price,
        'basePrice' => $price,
        'productType' => 'amount',
        'qtyValues' => [
            'min' => $minCount,
            'max' => $maxCount,
            'step' => max(1, (int) ($item['zerocount'] ?? 1)),
        ],
        'params' => $params,
        'available' => (bool) ($item['isActive'] ?? false),
        'parentId' => $this->swGamesCategoryId($item),
        'image' => $item['image'] ?? null,
        'description' => trim((string) (($item['note'] ?? '') ?: ($item['gameName'] ?? ''))),
        'providerCostPrice' => $price,
        'costPrice' => $price,
        'requiresPlayerId' => $dynamicFields->count() > 0,
        'requiresSecondaryPlayerId' => $dynamicFields->count() > 1,
        'playerIdLabel' => trim((string) (($dynamicFields->get(0)['label'] ?? $dynamicFields->get(0)['name'] ?? 'معرّف اللاعب'))),
        'secondaryPlayerIdLabel' => trim((string) (($dynamicFields->get(1)['label'] ?? $dynamicFields->get(1)['name'] ?? 'المعرّف الثاني'))),
        'quantityLabel' => 'الكمية',
        'amountMode' => 'custom_value',
        'deliveryMode' => 'api_topup',
        'providerProductType' => 'swgames',
        'providerQtyValues' => [
            'min' => $minCount,
            'max' => $maxCount,
            'step' => max(1, (int) ($item['zerocount'] ?? 1)),
        ],
        'providerParams' => $dynamicFields->all(),
        'purchaseFlow' => $dynamicFields->count() > 1 ? 'player_and_server' : 'player_custom_value',
        'minAmount' => $minCount,
        'maxAmount' => $maxCount,
    ];
}

    protected function previewSawa(ProviderSource $providerSource, string $productId): array
    {
        $productEndpoint = $providerSource->product_endpoint ?: '/products?products_id={id}';
        if (str_contains((string) $productEndpoint, '/products') && ! str_contains((string) $productEndpoint, 'products_id=')) {
            $productEndpoint = '/products?products_id={id}';
        }

        $response = $this->request($providerSource)->get($this->resolveUrl($providerSource, $productEndpoint, ['id' => $productId]), []);
        $items = $this->extractSawaProductList($response->json());
        $item = collect($items)->first(fn ($entry) => (string) ($entry['id'] ?? '') === (string) $productId);

        if (! $response->successful() || ! is_array($item)) {
            throw new \RuntimeException('تعذر جلب بيانات المنتج من المزود.');
        }

        return [
            'normalized' => $this->normalizeProduct($item, $providerSource),
            'raw' => $item,
        ];
    }

    protected function catalogSawa(ProviderSource $providerSource, int $parentId = 0): array
    {
        $catalogEndpoint = $providerSource->catalog_endpoint ?: '/content/{parentId}';
        if (str_contains((string) $catalogEndpoint, '/products')) {
            $catalogEndpoint = '/content/{parentId}';
        }

        $rateLimitKey = 'provider_catalog_sawa_rate_limited:' . $providerSource->id;
        $rateLimitedUntil = Cache::get($rateLimitKey);

        if ($rateLimitedUntil) {
            throw new \RuntimeException('مزود شمس موقوف مؤقتًا بسبب حد الطلبات. انتظر حتى: ' . $rateLimitedUntil . ' ثم اضغط متابعة الاستيراد.');
        }

        $cacheKey = 'provider_catalog_sawa:' . $providerSource->id . ':' . $parentId;
        $payload = Cache::get($cacheKey);

        if (! is_array($payload)) {
            try {
                // تخفيف ضغط الطلبات على Shams حتى لا يظهر 429.
                usleep(600000);

                $response = $this->request($providerSource)
                    ->timeout(90)
                    ->get($this->resolveUrl($providerSource, $catalogEndpoint, ['parentId' => $parentId]));
            } catch (\Illuminate\Http\Client\RequestException $exception) {
                $response = $exception->response ?? null;

                if ($response && (int) $response->status() === 429) {
                    Cache::put($rateLimitKey, now()->addMinutes(20)->toDateTimeString(), now()->addMinutes(20));
                    throw new \RuntimeException('مزود شمس أوقف الطلبات مؤقتًا بسبب كثرة المحاولات. انتظر 20 دقيقة ثم اضغط متابعة الاستيراد.');
                }

                throw $exception;
            }

            if ((int) $response->status() === 429) {
                Cache::put($rateLimitKey, now()->addMinutes(20)->toDateTimeString(), now()->addMinutes(20));
                throw new \RuntimeException('مزود شمس أوقف الطلبات مؤقتًا بسبب كثرة المحاولات. انتظر 20 دقيقة ثم اضغط متابعة الاستيراد.');
            }

            if (! $response->successful()) {
                $message = $this->normalizeProviderErrorMessage($response->json(), 'تعذر جلب قائمة المنتجات من المزود.');
                throw new \RuntimeException($message);
            }

            $payload = $response->json();
            Cache::put($cacheKey, $payload, now()->addMinutes(30));
        }
        $root = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $categories = [];
        $products = [];

        // Shams can return several shapes depending on parent id/version:
        // data => [categories/products], data => [items...], or nested content arrays.
        // We collect all known containers first, then fall back to a recursive mixed extractor.
        $knownCategoryContainers = [
            $root['categories'] ?? null,
            $root['sections'] ?? null,
            $root['category'] ?? null,
            $root['content'] ?? null,
        ];
        $knownProductContainers = [
            $root['products'] ?? null,
            $root['items'] ?? null,
            $root['data'] ?? null,
        ];

        foreach ($knownCategoryContainers as $container) {
            foreach ($this->toList($container) as $entry) {
                if (is_array($entry) && $this->isProviderCategory($entry, $providerSource)) {
                    $categories[] = $entry;
                }
            }
        }

        foreach ($knownProductContainers as $container) {
            foreach ($this->toList($container) as $entry) {
                if (is_array($entry) && $this->isProviderProduct($entry, $providerSource)) {
                    $products[] = $entry;
                }
            }
        }

        foreach ((array) $root as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            if (array_is_list($entry)) {
                foreach ($entry as $sub) {
                    if ($this->isProviderProduct($sub, $providerSource)) {
                        $products[] = $sub;
                    } elseif ($this->isProviderCategory($sub, $providerSource)) {
                        $categories[] = $sub;
                    }
                }

                continue;
            }

            if ($this->isProviderProduct($entry, $providerSource)) {
                $products[] = $entry;
            } elseif ($this->isProviderCategory($entry, $providerSource)) {
                $categories[] = $entry;
            }
        }

        $normalizedCategories = collect($categories)->unique('id')->map(fn ($entry) => [
            'id' => (int) ($entry['id'] ?? 0),
            'name' => (string) ($entry['name'] ?? 'قسم'),
            'parentId' => (int) ($entry['parent_id'] ?? $entry['parentId'] ?? $parentId),
            'image' => $entry['category_img'] ?? $entry['image'] ?? null,
        ])->filter(fn ($entry) => $entry['id'] > 0 && trim((string) $entry['name']) !== '')->values();

        $normalizedProducts = collect($products)->unique('id')
            ->map(fn ($entry) => $this->normalizeProduct($entry, $providerSource, $parentId))
            ->filter(fn ($entry) => ! empty($entry['id']) && trim((string) ($entry['name'] ?? '')) !== '')
            ->values();

        if ($normalizedCategories->isEmpty() && $normalizedProducts->isEmpty()) {
            $mixed = $this->extractMixedCatalogItems($payload, $providerSource, $parentId);
            $normalizedCategories = collect($mixed['categories'])->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)->values();
            $normalizedProducts = collect($mixed['products'])->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)->values();
        }

        return [
            'parentId' => $parentId,
            'categories' => $normalizedCategories->all(),
            'products' => $normalizedProducts->all(),
        ];
    }

    protected function previewGeneric(ProviderSource $providerSource, string $productId): array
    {
        $response = $this->request($providerSource)->get(
            $this->resolveUrl($providerSource, $providerSource->product_endpoint, ['id' => $productId]),
            $this->buildProductLookupQuery($providerSource, $productId)
        );
        $payload = $response->json();
        $item = $this->extractByPath($payload, data_get($providerSource->config, 'product_data_path'));

        if (is_array($item) && array_is_list($item)) {
            $item = collect($item)->first(fn ($entry) => (string) Arr::get((array) $entry, data_get($providerSource->config, 'field_map.id', 'id')) === (string) $productId);
        }

        if (! $response->successful() || ! is_array($item)) {
            throw new \RuntimeException($this->extractErrorMessage($payload) ?: 'تعذر جلب بيانات المنتج من المزود.');
        }

        return [
            'normalized' => $this->normalizeProduct($item, $providerSource),
            'raw' => $item,
        ];
    }

    protected function catalogGeneric(ProviderSource $providerSource, int $parentId = 0): array
    {
        $response = $this->request($providerSource)->get(
            $this->resolveUrl($providerSource, $providerSource->catalog_endpoint, ['parentId' => $parentId]),
            $this->buildCatalogQuery($providerSource, $parentId)
        );

        if (! $response->successful()) {
            $fallbackEndpoints = collect([
                data_get($providerSource->config, 'catalog_tree_endpoint'),
                data_get($providerSource->config, 'catalog_fallback_endpoint'),
                '/content/{parentId}',
                '/products',
            ])->filter()->unique()->values();

            foreach ($fallbackEndpoints as $fallbackEndpoint) {
                if ((string) $fallbackEndpoint === (string) $providerSource->catalog_endpoint) {
                    continue;
                }

                $fallbackResponse = $this->request($providerSource)->get(
                    $this->resolveUrl($providerSource, (string) $fallbackEndpoint, ['parentId' => $parentId]),
                    $this->buildCatalogQuery($providerSource, $parentId)
                );

                if ($fallbackResponse->successful()) {
                    $response = $fallbackResponse;
                    break;
                }
            }
        }

        if (! $response->successful()) {
            throw new \RuntimeException($this->extractErrorMessage($response->json()) ?: 'تعذر جلب قائمة المنتجات من المزود.');
        }

        $payload = $response->json();
        $categories = $this->extractByPath($payload, data_get($providerSource->config, 'catalog_categories_path', 'data.categories'));
        $products = $this->extractByPath($payload, data_get($providerSource->config, 'catalog_products_path', 'data.products'));

        $normalizedCategories = collect($this->toList($categories))
            ->filter(fn ($entry) => is_array($entry))
            ->map(function ($entry) use ($providerSource, $parentId) {
                $entry = (array) $entry;
                $idField = data_get($providerSource->config, 'field_map.id', 'id');
                $nameField = data_get($providerSource->config, 'field_map.name', 'name');
                $parentField = data_get($providerSource->config, 'field_map.parent_id', 'parent_id');

                return [
                    'id' => (int) Arr::get($entry, $idField, 0),
                    'name' => trim((string) Arr::get($entry, $nameField, '')),
                    'parentId' => (int) Arr::get($entry, $parentField, $parentId),
                    'image' => Arr::get($entry, 'image') ?: Arr::get($entry, 'category_img'),
                ];
            })
            ->filter(fn ($entry) => $entry['id'] > 0 && $entry['name'] !== '')
            ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
            ->values();

        $rawProducts = collect($this->toList($products))->filter(fn ($entry) => is_array($entry));
        if ($rawProducts->isEmpty() && is_array($payload) && array_is_list($payload)) {
            $rawProducts = collect($payload)->filter(fn ($entry) => is_array($entry));
        }

        $normalizedProducts = $rawProducts
            ->filter(fn ($entry) => $this->isProviderProduct($entry, $providerSource))
            ->map(fn ($entry) => $this->normalizeProduct((array) $entry, $providerSource))
            ->filter(fn ($entry) => ! empty($entry['id']) && trim((string) ($entry['name'] ?? '')) !== '')
            ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
            ->values();

        if ($normalizedCategories->isEmpty() && $normalizedProducts->isEmpty()) {
            $mixedCatalog = $this->extractMixedCatalogItems($payload, $providerSource, $parentId);
            $normalizedCategories = collect($mixedCatalog['categories'])
                ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
                ->values();
            $normalizedProducts = collect($mixedCatalog['products'])
                ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
                ->values();
        }

        if ($normalizedCategories->isEmpty() && $normalizedProducts->isEmpty() && ($providerSource->slug === 'shams4store' || str_contains((string) $providerSource->name, 'Shams'))) {
            $secondaryCatalogEndpoint = (string) (data_get($providerSource->config, 'catalog_tree_endpoint') ?: '/content/{parentId}');
            $secondaryCatalogResponse = $this->request($providerSource)->get(
                $this->resolveUrl($providerSource, $secondaryCatalogEndpoint, ['parentId' => $parentId]),
                $this->buildCatalogQuery($providerSource, $parentId)
            );

            if ($secondaryCatalogResponse->successful()) {
                $secondaryPayload = $secondaryCatalogResponse->json();
                $mixedCatalog = $this->extractMixedCatalogItems($secondaryPayload, $providerSource, $parentId);
                $normalizedCategories = collect($mixedCatalog['categories'])
                    ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
                    ->values();
                $normalizedProducts = collect($mixedCatalog['products'])
                    ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
                    ->values();
            }
        }

        if ($normalizedProducts->isEmpty() && filled(data_get($providerSource->config, 'catalog_fallback_endpoint'))) {
            $fallbackResponse = $this->request($providerSource)->get(
                $this->resolveUrl($providerSource, data_get($providerSource->config, 'catalog_fallback_endpoint')),
                (array) data_get($providerSource->config, 'catalog_fallback_query', [])
            );

            if ($fallbackResponse->successful()) {
                $fallbackPayload = $fallbackResponse->json();
                $fallbackProducts = $this->extractByPath($fallbackPayload, data_get($providerSource->config, 'catalog_fallback_products_path', '__root__'));
                $normalizedProducts = collect($this->toList($fallbackProducts))
                    ->filter(fn ($entry) => $this->isProviderProduct($entry, $providerSource))
                    ->map(fn ($entry) => $this->normalizeProduct((array) $entry, $providerSource, $parentId))
                    ->filter(fn ($entry) => ! empty($entry['id']) && trim((string) ($entry['name'] ?? '')) !== '')
                    ->filter(fn ($entry) => (int) ($entry['parentId'] ?? 0) === $parentId)
                    ->values();
            }
        }

        return [
            'parentId' => $parentId,
            'categories' => $normalizedCategories->all(),
            'products' => $normalizedProducts->all(),
        ];
    }

    protected function orderSawa(ProviderSource $providerSource, string $productId, array $payload): array
    {
        $response = $this->request($providerSource)->get($this->resolveUrl($providerSource, $providerSource->order_endpoint, ['id' => $productId]), $payload);
        $json = $response->json();
        $data = is_array($json) ? ($json['data'] ?? null) : null;

        if (! $response->successful() || ! is_array($data)) {
            throw new \RuntimeException($this->extractErrorMessage($json) ?: 'تعذر إتمام الطلب من المزود الخارجي.');
        }

        return $data;
    }

    protected function orderGeneric(ProviderSource $providerSource, string $productId, array $payload): array
    {
        $method = strtolower((string) data_get($providerSource->config, 'order_http_method', 'get'));
        $url = $this->resolveUrl($providerSource, $providerSource->order_endpoint, ['id' => $productId]);
        $response = $method === 'post'
            ? $this->request($providerSource)->asForm()->post($url, $payload)
            : $this->request($providerSource)->get($url, $payload);
        $json = $response->json();
        $data = $this->extractByPath($json, data_get($providerSource->config, 'order_data_path', 'data'));

        if (! $response->successful() || ! is_array($data)) {
            throw new \RuntimeException($this->extractErrorMessage($json) ?: 'تعذر إتمام الطلب من المزود الخارجي.');
        }

        return array_merge(['response_status' => $json['status'] ?? null], $data);
    }

    protected function checkSawa(ProviderSource $providerSource, array $orderIdentifiers, bool $useUuid = false): array
    {
        return $this->checkGeneric($providerSource, $orderIdentifiers, $useUuid);
    }

    protected function checkGeneric(ProviderSource $providerSource, array $orderIdentifiers, bool $useUuid = false): array
    {
        if (blank($providerSource->check_endpoint)) {
            throw new \RuntimeException('هذا المزود لا يدعم متابعة حالة الطلبات.');
        }

        $orderIdentifiers = collect($orderIdentifiers)->map(fn ($value) => trim((string) $value))->filter()->values()->all();
        if ($orderIdentifiers === []) {
            return [];
        }

        $ordersValue = '[' . collect($orderIdentifiers)->map(function ($value) use ($useUuid) {
            return $useUuid ? '"' . addslashes($value) . '"' : $value;
        })->implode(',') . ']';

        $params = ['orders' => $ordersValue];
        if ($useUuid) {
            $params['uuid'] = 1;
        }

        $response = $this->request($providerSource)->get($this->resolveUrl($providerSource, $providerSource->check_endpoint), $params);
        if (! $response->successful()) {
            throw new \RuntimeException($this->extractErrorMessage($response->json()) ?: 'تعذر جلب حالة الطلبات من المزود.');
        }

        $json = $response->json();
        $data = $this->extractByPath($json, data_get($providerSource->config, 'check_data_path', 'data'));

        return collect($this->toList($data))->filter(fn ($item) => is_array($item))->values()->all();
    }

    protected function request(ProviderSource $providerSource)
    {
        $headers = [];
        if ($providerSource->api_token) {
            $headers[$providerSource->auth_header ?: 'api-token'] = trim(($providerSource->auth_prefix ?: '') . $providerSource->getRawOriginal('api_token'));
        }

        $request = Http::withHeaders($headers)
            ->acceptJson()
            ->connectTimeout(30)
            ->timeout(120)
            ->retry(2, 1200, function ($exception) {
                $response = $exception->response ?? null;
                if ($response && method_exists($response, 'status') && (int) $response->status() === 429) {
                    return false;
                }

                return true;
            }, false);

        if (app()->environment('local') && (bool) data_get($providerSource->config, 'verify_ssl', true) === false) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }

    protected function resolveUrl(ProviderSource $providerSource, ?string $endpoint, array $values = []): string
    {
        $endpoint = (string) $endpoint;
        foreach ($values as $key => $value) {
            $endpoint = str_replace('{' . $key . '}', (string) $value, $endpoint);
        }

        if (Str::startsWith($endpoint, ['http://', 'https://'])) {
            return $endpoint;
        }

        return rtrim((string) $providerSource->base_url, '/') . '/' . ltrim($endpoint, '/');
    }

    protected function buildCatalogQuery(ProviderSource $providerSource, int $parentId): array
    {
        $params = (array) data_get($providerSource->config, 'catalog_query', []);
        if (data_get($providerSource->config, 'catalog_parent_id_param')) {
            $params[(string) data_get($providerSource->config, 'catalog_parent_id_param')] = $parentId;
        }

        return $params;
    }

    protected function buildProductLookupQuery(ProviderSource $providerSource, string $productId): array
    {
        $params = (array) data_get($providerSource->config, 'product_query', []);
        if (data_get($providerSource->config, 'product_lookup_param')) {
            $params[(string) data_get($providerSource->config, 'product_lookup_param')] = $productId;
        }

        return $params;
    }

    protected function extractByPath(mixed $payload, ?string $path): mixed
    {
        if ($path === null || $path === '' || $path === '__root__') {
            return $payload;
        }

        return data_get($payload, $path);
    }

    protected function toList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        if (array_is_list($value)) {
            return $value;
        }

        return [$value];
    }


    protected function extractMixedCatalogItems(mixed $payload, ProviderSource $providerSource, int $parentId = 0): array
    {
        $queue = [[
            'node' => $payload,
            'contextParentId' => $parentId,
        ]];
        $categories = [];
        $products = [];
        $seenCategoryIds = [];
        $seenProductIds = [];
        $fieldMap = (array) data_get($providerSource->config, 'field_map', []);
        $idField = $fieldMap['id'] ?? 'id';
        $nameField = $fieldMap['name'] ?? 'name';
        $parentField = $fieldMap['parent_id'] ?? 'parent_id';

        while ($queue !== []) {
            $frame = array_shift($queue);
            $current = $frame['node'] ?? null;
            $contextParentId = (int) ($frame['contextParentId'] ?? $parentId);

            if (! is_array($current)) {
                continue;
            }

            $nextContextParentId = $contextParentId;

            if ($this->isProviderProduct($current, $providerSource)) {
                $normalized = $this->normalizeProduct($current, $providerSource);
                $normalized['parentId'] = (int) ($normalized['parentId'] ?? 0) > 0
                    ? (int) $normalized['parentId']
                    : $contextParentId;

                $productId = (string) ($normalized['id'] ?? '');
                if ($productId !== '' && ! isset($seenProductIds[$productId])) {
                    $products[] = $normalized;
                    $seenProductIds[$productId] = true;
                }
            } elseif ($this->isProviderCategory($current, $providerSource)) {
                $categoryId = (int) Arr::get($current, $idField, 0);
                $categoryName = trim((string) Arr::get($current, $nameField, ''));
                $categoryParentId = (int) Arr::get($current, $parentField, 0);
                $categoryParentId = $categoryParentId > 0 ? $categoryParentId : $contextParentId;

                if ($categoryId > 0 && ! isset($seenCategoryIds[$categoryId])) {
                    $categories[] = [
                        'id' => $categoryId,
                        'name' => $categoryName,
                        'parentId' => $categoryParentId,
                        'image' => Arr::get($current, 'image') ?: Arr::get($current, 'category_img'),
                    ];
                    $seenCategoryIds[$categoryId] = true;
                }

                if ($categoryId > 0) {
                    $nextContextParentId = $categoryId;
                }
            }

            foreach ($current as $value) {
                if (is_array($value)) {
                    $queue[] = [
                        'node' => $value,
                        'contextParentId' => $nextContextParentId,
                    ];
                }
            }
        }

        return [
            'categories' => collect($categories)
                ->filter(fn ($entry) => $entry['id'] > 0 && $entry['name'] !== '')
                ->values()
                ->all(),
            'products' => collect($products)
                ->filter(fn ($entry) => ! empty($entry['id']) && trim((string) ($entry['name'] ?? '')) !== '')
                ->values()
                ->all(),
        ];
    }

    protected function extractSawaProductList(mixed $payload): array
    {
        if (! is_array($payload)) {
            return [];
        }

        $root = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;

        if (isset($root['products']) && is_array($root['products'])) {
            return array_values(array_filter($root['products'], fn ($item) => is_array($item)));
        }

        if (array_is_list($root)) {
            return array_values(array_filter($root, fn ($item) => is_array($item)));
        }

        $products = [];
        foreach ($root as $value) {
            if (! is_array($value)) {
                continue;
            }

            if (array_is_list($value)) {
                foreach ($value as $entry) {
                    if (is_array($entry)) {
                        $products[] = $entry;
                    }
                }
            } else {
                $products[] = $value;
            }
        }

        return $products;
    }

    public function normalizeProduct(array $item, ProviderSource $providerSource, int $contextParentId = 0): array
    {
        $fieldMap = (array) data_get($providerSource->config, 'field_map', []);
        $get = fn (string $key, mixed $default = null) => Arr::get($item, $fieldMap[$key] ?? $key, $default);
        $qtyValues = $get('qty_values');
        $params = array_values(array_filter((array) $get('params', []), fn ($value) => trim((string) $value) !== ''));
        $productType = (string) $get('product_type', 'package');
        $providerPrice = (float) $get('price', 0);
        $providerBaseCost = (float) $get('base_price', $providerPrice);
        $name = $this->cleanProductName((string) $get('name', 'منتج'));
        $categoryName = trim((string) ($get('category_name', '') ?: ''));
        $parentId = (int) $get('parent_id', 0);
        if ($parentId <= 0) {
            $parentId = $contextParentId;
        }
        $normalizedQtyValues = $this->normalizeQtyValues($qtyValues);
        $hasSelectableOptions = is_array($normalizedQtyValues) && array_is_list($normalizedQtyValues) && count($normalizedQtyValues) > 1;
        $isCustomAmount = is_array($normalizedQtyValues) && ! array_is_list($normalizedQtyValues);
        $requiresPlayerId = count($params) > 0;
        $requiresSecondaryPlayerId = count($params) > 1;

        $purchaseFlow = 'direct_purchase';
        if ($requiresSecondaryPlayerId) {
            $purchaseFlow = $hasSelectableOptions ? 'player_and_server' : ($isCustomAmount || $productType === 'amount' ? 'player_custom_value' : 'player_and_server');
        } elseif ($requiresPlayerId) {
            $purchaseFlow = $hasSelectableOptions ? 'player_category' : ($isCustomAmount || $productType === 'amount' ? 'player_custom_value' : 'direct_purchase');
        } elseif ($hasSelectableOptions) {
            $purchaseFlow = 'codes_quantity';
        } elseif ($isCustomAmount || $productType === 'amount') {
            $purchaseFlow = 'player_custom_value';
        }

        $amountMode = $isCustomAmount || $productType === 'amount' ? 'custom_value' : 'quantity';
        $deliveryMode = $productType === 'amount' ? 'api_topup' : 'api_codes';
        $singleFixedValue = is_array($normalizedQtyValues) && array_is_list($normalizedQtyValues) && count($normalizedQtyValues) === 1
            ? (int) $normalizedQtyValues[0]
            : 1;

        $normalized = [
            'id' => trim((string) $get('id', '')),
            'name' => $name !== '' ? $name : ($categoryName !== '' ? $categoryName : 'منتج'),
            'categoryName' => $categoryName,
            'price' => $providerPrice,
            'basePrice' => $providerBaseCost,
            'productType' => $productType,
            'qtyValues' => $normalizedQtyValues,
            'params' => $params,
            'available' => (bool) $get('available', true),
            'parentId' => $parentId,
            'image' => $get('image'),
            'description' => $categoryName !== '' ? $categoryName : $name,
            'providerCostPrice' => $providerBaseCost,
            'costPrice' => $providerBaseCost,
            'requiresPlayerId' => $requiresPlayerId,
            'requiresSecondaryPlayerId' => $requiresSecondaryPlayerId,
            'playerIdLabel' => $params[0] ?? 'معرّف اللاعب',
            'secondaryPlayerIdLabel' => $params[1] ?? 'المعرّف الثاني / السيرفر',
            'quantityLabel' => $amountMode === 'custom_value' ? 'القيمة المطلوبة' : ($hasSelectableOptions ? 'الفئة' : 'الكمية'),
            'amountMode' => $amountMode,
            'deliveryMode' => $deliveryMode,
            'providerProductType' => $productType,
            'providerQtyValues' => $normalizedQtyValues,
            'providerParams' => $params,
            'purchaseFlow' => $purchaseFlow,
            'minAmount' => $isCustomAmount ? max(1, (int) ($normalizedQtyValues['min'] ?? 1)) : $singleFixedValue,
            'maxAmount' => $isCustomAmount ? max(1, (int) ($normalizedQtyValues['max'] ?? 1)) : $singleFixedValue,
        ];

        return $normalized;
    }

    protected function isProviderProduct(mixed $entry, ProviderSource $providerSource): bool
    {
        $fieldMap = (array) data_get($providerSource->config, 'field_map', []);
        $idField = $fieldMap['id'] ?? 'id';
        $nameField = $fieldMap['name'] ?? 'name';

        return is_array($entry)
            && Arr::has($entry, $idField)
            && trim((string) Arr::get($entry, $nameField, '')) !== ''
            && (
                Arr::has($entry, $fieldMap['price'] ?? 'price')
                || Arr::has($entry, $fieldMap['base_price'] ?? 'base_price')
                || Arr::has($entry, $fieldMap['product_type'] ?? 'product_type')
                || Arr::has($entry, $fieldMap['params'] ?? 'params')
                || Arr::has($entry, $fieldMap['category_name'] ?? 'category_name')
            );
    }

    protected function isProviderCategory(mixed $entry, ProviderSource $providerSource): bool
    {
        $fieldMap = (array) data_get($providerSource->config, 'field_map', []);
        $idField = $fieldMap['id'] ?? 'id';
        $nameField = $fieldMap['name'] ?? 'name';

        return is_array($entry)
            && Arr::has($entry, $idField)
            && trim((string) Arr::get($entry, $nameField, '')) !== ''
            && ! $this->isProviderProduct($entry, $providerSource);
    }

    protected function normalizeQtyValues(mixed $qtyValues): mixed
    {
        if (! is_array($qtyValues)) {
            return $qtyValues;
        }

        if (array_is_list($qtyValues)) {
            return collect($qtyValues)
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->values()
                ->all();
        }

        if (array_key_exists('min', $qtyValues) || array_key_exists('max', $qtyValues)) {
            return [
                'min' => max(1, (int) ($qtyValues['min'] ?? 1)),
                'max' => max(1, (int) ($qtyValues['max'] ?? ($qtyValues['min'] ?? 1))),
            ];
        }

        return $qtyValues;
    }

    protected function cleanProductName(string $name): string
    {
        $cleaned = trim(preg_replace('/\s+/', ' ', $name));
        $cleaned = preg_replace('/^[A-Za-z]-/u', '', $cleaned) ?: $cleaned;

        return trim($cleaned);
    }

    protected function extractErrorMessage(mixed $payload): ?string
    {
        if (! is_array($payload)) {
            return null;
        }

        foreach (['message', 'error', 'msg'] as $key) {
            if (filled($payload[$key] ?? null)) {
                return trim((string) $payload[$key]);
            }
        }

        $data = $payload['data'] ?? null;
        if (is_array($data)) {
            foreach (['message', 'error', 'msg'] as $key) {
                if (filled($data[$key] ?? null)) {
                    return trim((string) $data[$key]);
                }
            }
        }

        foreach (['errors', 'details'] as $key) {
            if (filled($payload[$key] ?? null) && ! is_array($payload[$key])) {
                return trim((string) $payload[$key]);
            }
        }

        return null;
    }
}

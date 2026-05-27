<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Card;
use App\Models\ImportedProviderProduct;
use App\Models\ProviderSource;
use App\Services\Providers\ProviderGateway;

function findProvider(string $type): ?ProviderSource {
    return ProviderSource::query()->get()->first(function ($p) use ($type) {
        $name = mb_strtolower((string) $p->name);
        $slug = mb_strtolower((string) $p->slug);
        $driver = mb_strtolower((string) $p->driver);
        $url = mb_strtolower((string) $p->base_url);

        if ($type === 'sw') {
            return str_contains($name, 'sw')
                || str_contains($slug, 'sw')
                || str_contains($driver, 'swgames')
                || str_contains($url, 'sw-games');
        }

        return str_contains($name, 'shams')
            || str_contains($name, 'shams4store')
            || str_contains($slug, 'shams')
            || str_contains($driver, 'sawa')
            || str_contains($url, 'shams4store')
            || str_contains($url, 'ahminix');
    });
}

function countRemoteProducts(ProviderSource $provider): array {
    $gateway = app(ProviderGateway::class);
    $visited = [];
    $categories = 0;
    $products = 0;

    $walk = function ($parentId = 0) use (&$walk, &$visited, &$categories, &$products, $gateway, $provider) {
        $key = (int) $parentId;

        if (isset($visited[$key])) {
            return;
        }

        $visited[$key] = true;

        try {
            $catalog = $gateway->catalog($provider, $key);
        } catch (Throwable $e) {
            echo "⚠️ خطأ بجلب {$provider->name}: " . $e->getMessage() . PHP_EOL;
            return;
        }

        $items = $catalog['products'] ?? [];
        $products += is_countable($items) ? count($items) : 0;

        foreach (($catalog['categories'] ?? []) as $cat) {
            $id = (int) ($cat['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }

            $categories++;
            $walk($id);
        }
    };

    $walk(0);

    return [
        'categories' => $categories,
        'products' => $products,
    ];
}

$providers = [
    'SW Games' => findProvider('sw'),
    'Shams' => findProvider('shams'),
];

echo PHP_EOL;
echo "==============================" . PHP_EOL;
echo "📊 تقرير المنتجات" . PHP_EOL;
echo "==============================" . PHP_EOL;

foreach ($providers as $label => $provider) {
    echo PHP_EOL . "# {$label}" . PHP_EOL;

    if (! $provider) {
        echo "❌ المزود غير موجود بقاعدة البيانات" . PHP_EOL;
        continue;
    }

    $cardsCount = Card::where('provider_source_id', $provider->id)->count();
    $libraryCount = ImportedProviderProduct::where('provider_source_id', $provider->id)->count();
    $remote = countRemoteProducts($provider);

    echo "✅ المزود: {$provider->name}" . PHP_EOL;
    echo "🛒 المنتجات المستوردة عندك بالمتجر Cards: {$cardsCount}" . PHP_EOL;
    echo "📦 المنتجات المحفوظة بمكتبة الاستيراد: {$libraryCount}" . PHP_EOL;
    echo "🌍 المنتجات الموجودة عند المزود نفسه: {$remote['products']}" . PHP_EOL;
    echo "📁 الأقسام المقروءة من المزود: {$remote['categories']}" . PHP_EOL;
}

echo PHP_EOL;

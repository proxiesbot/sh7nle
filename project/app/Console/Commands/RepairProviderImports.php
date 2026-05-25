<?php

namespace App\Console\Commands;

use App\Models\Card;
use App\Models\ImportedProviderProduct;
use App\Models\Section;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairProviderImports extends Command
{
    protected $signature = 'sh7nle:repair-provider-imports
        {--provider= : Provider source id or slug}
        {--limit=5000 : Maximum imported products to repair}
        {--target-root= : Root section name to move fallback imported products under, e.g. الألعاب}
        {--fallback-section=منتجات مستوردة : Fallback section name created by old imports}
        {--move-fallback : Move cards currently inside fallback section to the target root}
        {--prune-empty-sections : Delete empty imported sections after repair}';

    protected $description = 'Publish/repair imported provider products into visible store cards without duplicating them or keeping old fallback sections.';

    public function handle(): int
    {
        $targetRootName = trim((string) $this->option('target-root'));
        $moveFallback = (bool) $this->option('move-fallback');

        if ($moveFallback && $targetRootName === '') {
            $this->error('When using --move-fallback you must pass --target-root="اسم القسم".');
            return self::FAILURE;
        }

        $movedFallback = 0;
        if ($moveFallback) {
            $movedFallback = $this->moveFallbackCards($targetRootName);
            $this->info("Moved old fallback cards: {$movedFallback}");
        }

        $query = ImportedProviderProduct::query()->with('providerSource')->latest('updated_at');
        $provider = trim((string) $this->option('provider'));
        if ($provider !== '') {
            $query->whereHas('providerSource', function ($builder) use ($provider) {
                is_numeric($provider)
                    ? $builder->where('id', (int) $provider)
                    : $builder->where('slug', $provider);
            });
        }

        $limit = max(1, (int) $this->option('limit'));
        $created = 0;
        $updated = 0;
        $failed = 0;

        $query->limit($limit)->chunkById(100, function ($products) use (&$created, &$updated, &$failed, $targetRootName) {
            foreach ($products as $product) {
                try {
                    $result = $this->publish($product, $targetRootName);
                    $result === 'created' ? $created++ : $updated++;
                } catch (\Throwable $exception) {
                    $failed++;
                    $this->warn('Failed '.$product->remote_id.': '.$exception->getMessage());
                }
            }
        });

        $pruned = 0;
        if ($this->option('prune-empty-sections')) {
            $pruned = $this->pruneEmptyImportedSections();
        }

        $this->info("Repair completed. Created: {$created}, Updated: {$updated}, Failed: {$failed}, Moved fallback: {$movedFallback}, Pruned empty sections: {$pruned}");
        return self::SUCCESS;
    }

    protected function publish(ImportedProviderProduct $product, string $targetRootName = ''): string
    {
        $section = $this->resolveSection($product, $targetRootName);
        if (! $section) {
            throw new \RuntimeException('No category path found. Pass --target-root to force a root section.');
        }

        $providerCost = $this->money($product->provider_cost_price ?: $product->cost_price ?: $product->base_price ?: $product->price);
        $markup = (float) Setting::get('pricing.global_markup_percentage', 0);
        $price = $providerCost > 0 ? $this->money($providerCost * (1 + ($markup / 100))) : $this->money($product->price ?: 0);
        if ($providerCost > 0 && $price < $providerCost) {
            $price = $providerCost;
        }

        $payload = [
            'name' => $product->name ?: 'منتج',
            'section_id' => $section->id,
            'provider_source_id' => $product->provider_source_id,
            'background' => $product->image,
            'icon' => $product->image ?: ($section->icon ?: '/favicon.ico'),
            'description' => $product->description ?: $product->category_path,
            'price' => $price,
            'minAmount' => max(1, (int) ($product->min_amount ?: 1)),
            'maxAmount' => max(1, (int) ($product->max_amount ?: 1)),
            'discount' => 0,
            'sawaCardId' => $product->remote_id,
            'provider_product_id' => $product->remote_id,
            'cost_price' => $providerCost,
            'provider_cost_price' => $providerCost,
            'price_adjustment_percentage' => $markup,
            'profit_percentage' => $markup,
            'is_active' => true,
            'requires_player_id' => (bool) $product->requires_player_id,
            'player_id_label' => $product->player_id_label ?: 'معرّف اللاعب',
            'quantity_label' => $product->quantity_label ?: 'الكمية',
            'amount_mode' => $product->amount_mode ?: 'quantity',
            'delivery_mode' => $product->delivery_mode ?: 'manual_review',
            'provider_product_type' => $product->provider_product_type ?: 'package',
            'provider_qty_values' => $product->provider_qty_values,
            'provider_params' => $product->provider_params,
            'purchase_flow' => $product->purchase_flow ?: 'codes_quantity',
            'requires_secondary_player_id' => (bool) $product->requires_secondary_player_id,
            'secondary_player_id_label' => $product->secondary_player_id_label ?: 'المعرّف الثاني / السيرفر',
            'manual_unavailable' => ! (bool) $product->available,
            'availability_note' => (bool) $product->available ? null : 'غير متوفر من المزود أثناء آخر استيراد.',
        ];

        $card = Card::query()
            ->where('provider_source_id', $product->provider_source_id)
            ->where(function ($query) use ($product) {
                $query->where('provider_product_id', $product->remote_id)
                    ->orWhere('sawaCardId', $product->remote_id);
            })
            ->first();

        if ($card) {
            $card->fill($payload)->save();
            return 'updated';
        }

        Card::query()->create($payload);
        return 'created';
    }

    protected function resolveSection(ImportedProviderProduct $product, string $targetRootName = ''): ?Section
    {
        $names = $this->extractNames($product);

        if ($targetRootName !== '') {
            $normalizedRoot = $this->normalizeComparable($targetRootName);
            while ($names->isNotEmpty() && $this->normalizeComparable($names->first()) === $normalizedRoot) {
                $names->shift();
                $names = $names->values();
            }

            $root = Section::query()->firstOrCreate(
                ['name' => $targetRootName, 'section_id' => 0],
                ['description' => 'قسم رئيسي تم تثبيته لإصلاح المنتجات المستوردة.', 'icon' => '/favicon.ico', 'background' => null]
            );

            return $this->createPath($names->all(), $root->id, $product->image) ?: $root;
        }

        if ($names->isEmpty()) {
            return null;
        }

        return $this->createPath($names->all(), 0, $product->image);
    }

    protected function moveFallbackCards(string $targetRootName): int
    {
        $fallbackName = trim((string) $this->option('fallback-section')) ?: 'منتجات مستوردة';
        $fallbackSections = Section::query()->where('name', $fallbackName)->get();
        if ($fallbackSections->isEmpty()) {
            return 0;
        }

        $moved = 0;
        foreach ($fallbackSections as $fallbackSection) {
            Card::query()
                ->where('section_id', $fallbackSection->id)
                ->whereNotNull('provider_source_id')
                ->chunkById(100, function ($cards) use (&$moved, $targetRootName) {
                    foreach ($cards as $card) {
                        $product = ImportedProviderProduct::query()
                            ->where('provider_source_id', $card->provider_source_id)
                            ->where(function ($query) use ($card) {
                                if ($card->provider_product_id) {
                                    $query->orWhere('remote_id', $card->provider_product_id);
                                }
                                if ($card->sawaCardId) {
                                    $query->orWhere('remote_id', $card->sawaCardId);
                                }
                            })
                            ->first();

                        if (! $product) {
                            $root = Section::query()->firstOrCreate(
                                ['name' => $targetRootName, 'section_id' => 0],
                                ['description' => 'قسم رئيسي تم تثبيته لإصلاح المنتجات المستوردة.', 'icon' => '/favicon.ico', 'background' => null]
                            );
                            $card->section_id = $root->id;
                            $card->save();
                            $moved++;
                            continue;
                        }

                        $section = $this->resolveSection($product, $targetRootName);
                        if ($section) {
                            $card->section_id = $section->id;
                            $card->save();
                            $moved++;
                        }
                    }
                });
        }

        return $moved;
    }

    protected function extractNames(ImportedProviderProduct $product)
    {
        $names = collect($product->category_names ?? [])
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($names->isEmpty() && filled($product->category_path)) {
            $names = collect(explode('/', (string) $product->category_path))
                ->map(fn ($name) => trim((string) $name))
                ->filter()
                ->values();
        }

        if ($names->isEmpty() && filled(data_get($product->raw_payload, 'category_name'))) {
            $names = collect([trim((string) data_get($product->raw_payload, 'category_name'))])->filter()->values();
        }

        $productName = $this->normalizeComparable($product->name);
        if ($productName !== '' && $names->isNotEmpty()) {
            while ($names->isNotEmpty() && $this->normalizeComparable($names->last()) === $productName) {
                $names->pop();
                $names = $names->values();
            }
        }

        return $names;
    }

    protected function createPath(array $names, int $parentId = 0, ?string $icon = null): ?Section
    {
        $names = collect($names)->map(fn ($name) => trim((string) $name))->filter()->values();
        if ($names->isEmpty()) {
            return null;
        }

        $section = null;
        foreach ($names as $name) {
            $section = Section::query()->firstOrCreate(
                ['name' => $name, 'section_id' => $parentId],
                ['description' => 'تم إنشاؤه تلقائيًا أثناء إصلاح المنتجات المستوردة.', 'icon' => $icon ?: '/favicon.ico', 'background' => null]
            );
            $parentId = $section->id;
        }

        return $section;
    }

    protected function pruneEmptyImportedSections(): int
    {
        $deleted = 0;

        do {
            $sections = Section::query()
                ->withCount(['subSections', 'cards'])
                ->where(function ($query) {
                    $query->where('description', 'like', '%استيراد%')
                        ->orWhere('description', 'like', '%مستوردة%')
                        ->orWhere('name', 'منتجات مستوردة')
                        ->orWhere('icon', '/favicon.ico');
                })
                ->where('name', '!=', 'Sh7nle Gift Cards')
                ->get()
                ->filter(fn ($section) => (int) $section->sub_sections_count === 0 && (int) $section->cards_count === 0);

            foreach ($sections as $section) {
                $section->delete();
                $deleted++;
            }
        } while ($sections->isNotEmpty());

        return $deleted;
    }

    protected function normalizeComparable($value): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim((string) $value)));
    }

    protected function money(float|string|null $value): float
    {
        return round(max(0, (float) $value), 8);
    }
}

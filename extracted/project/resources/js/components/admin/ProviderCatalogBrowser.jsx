import { useEffect, useState } from 'react';
import { ChevronLeft, FolderOpen, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';

const ROOT_TRAIL = [{ id: 0, name: 'الرئيسية' }];

function money(value) {
    return formatPrice(value);
}

export default function ProviderCatalogBrowser({ enabled = true, providerSourceId = '', onPickProduct, onImportGroup }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [trail, setTrail] = useState(ROOT_TRAIL);
    const [catalog, setCatalog] = useState({ parentId: 0, categories: [], products: [] });

    const loadCatalog = async (parentId = 0, nextTrail = ROOT_TRAIL) => {
        if (!providerSourceId) return;
        setLoading(true);
        setError('');
        try {
            const response = await window.axios.get(route('card.providerCatalog'), {
                params: { parentId, providerSourceId },
            });
            setCatalog(response.data?.data || { parentId, categories: [], products: [] });
            setTrail(nextTrail);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'تعذر تحميل فهرس المزود.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (enabled && providerSourceId) {
            loadCatalog(0, ROOT_TRAIL);
        }
    }, [enabled, providerSourceId]);

    if (!enabled || !providerSourceId) {
        return null;
    }

    return (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">استعراض المزود</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">افتح الأقسام ثم اختر منتجًا مفردًا أو استورد جميع المنتجات الظاهرة كخيارات داخل بطاقة واحدة.</div>
                </div>
                <Button type="button" variant="outline" onClick={() => loadCatalog(catalog.parentId || 0, trail)} disabled={loading}>
                    <RefreshCcw className="ml-2 h-4 w-4" />
                    تحديث
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {trail.map((node, index) => (
                    <button
                        key={`${node.id}-${index}`}
                        type="button"
                        onClick={() => loadCatalog(node.id, trail.slice(0, index + 1))}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900"
                    >
                        {node.name}
                    </button>
                ))}
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {loading && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">جاري تحميل الفهرس...</div>}

            {!loading && (
                <>
                    {catalog.categories.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {catalog.categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => loadCatalog(category.id, [...trail, { id: category.id, name: category.name }])}
                                    className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-4 text-right shadow-sm transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-700 dark:hover:bg-slate-900"
                                >
                                    <ChevronLeft className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{category.name}</div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {category.id}</div>
                                    </div>
                                    <FolderOpen className="h-5 w-5 text-sky-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {catalog.products.length > 0 && (
                        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">المنتجات المتاحة داخل هذا القسم</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">يمكنك استيراد منتج واحد، أو جميع المنتجات الظاهرة كخيارات جاهزة مع أسعارها الأساسية.</div>
                                </div>
                                {catalog.products.length > 1 && (
                                    <Button type="button" onClick={() => onImportGroup?.(catalog.products, trail)} className="bg-sky-600 hover:bg-sky-700">
                                        استيراد الكل كخيارات
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {catalog.products.map((product) => (
                                    <div key={product.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{product.name}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {product.id}{product.categoryName ? ` • ${product.categoryName}` : ''}</div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                <span className="rounded-full bg-white px-3 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300">البيع: {money(product.price)}</span>
                                                <span className="rounded-full bg-white px-3 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300">التكلفة: {money(product.basePrice)}</span>
                                                <span className="rounded-full bg-white px-3 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300">النوع: {product.productType || 'package'}</span>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" onClick={() => onPickProduct?.(product)}>
                                            استيراد هذا المنتج
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!catalog.categories.length && !catalog.products.length && !error && (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            هذا القسم لا يحتوي عناصر قابلة للاستيراد حاليًا.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

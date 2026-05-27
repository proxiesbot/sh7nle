import { useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, BadgeDollarSign, Gift, ImagePlus, Save, Settings2, ShoppingBag, Sparkles } from 'lucide-react';
import { formatNumberPrecise } from '@/lib/formatters';

function isGiftCard(card) {
    return card?.delivery_mode === 'internal_gift_card' || String(card?.name || '').toLowerCase().includes('gift card');
}

export default function StoreProductCard({ card, onBuy, compact = false }) {
    const { auth, isSuperAdmin } = usePage().props;
    const [localPrice, setLocalPrice] = useState(card?.price ?? 0);
    const [providerCost, setProviderCost] = useState(card?.provider_cost_price ?? card?.cost_price ?? 0);
    const [localIcon, setLocalIcon] = useState(card?.background_image || card?.image || card?.icon || '');
    const [manualUnavailable, setManualUnavailable] = useState(Boolean(card?.manual_unavailable));
    const [localSortOrder, setLocalSortOrder] = useState(Number(card?.sort_order || 0));
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const fileRef = useRef(null);
    const gift = isGiftCard(card);
    const unavailable = manualUnavailable || Boolean(card?.provider_unavailable_at) || card?.is_active === false;

    const handleClick = () => {
        if (isSuperAdmin || unavailable) return;

        if (auth?.user) {
            onBuy({ ...card, price: localPrice });
            return;
        }
        window.location.href = route('login');
    };

    const savePrice = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isSuperAdmin || saving) return;

        setSaving(true);
        setMessage('');

        router.post(
            route('cards.quickPrice', card.id),
            {
                price: localPrice,
                providerCostPrice: providerCost,
                costPrice: providerCost,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setMessage('تم الحفظ');
                    window.setTimeout(() => setMessage(''), 1800);
                },
                onError: (errors) => setMessage(Object.values(errors || {})[0] || 'تعذر الحفظ'),
                onFinish: () => setSaving(false),
            },
        );
    };

    const saveSortOrder = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isSuperAdmin || saving) return;

        setSaving(true);
        setMessage('');

        router.post(
            route('card.quickSort', card.id),
            { sortOrder: Number(localSortOrder || 0) },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setMessage('تم تحديث الترتيب');
                    window.setTimeout(() => setMessage(''), 1800);
                },
                onError: (errors) => setMessage(Object.values(errors || {})[0] || 'تعذر حفظ الترتيب'),
                onFinish: () => setSaving(false),
            },
        );
    };

    const saveImage = (event) => {
        const file = event.target.files?.[0];
        if (!file || !isSuperAdmin) return;
        const formData = new FormData();
        formData.append('icon', file);
        setSaving(true);
        window.axios.post(route('cards.quickImage', card.id), formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                setLocalIcon(res.data.icon);
                setMessage('تم تحديث الصورة');
            })
            .catch((error) => setMessage(error.response?.data?.message || 'تعذر تحديث الصورة'))
            .finally(() => {
                setSaving(false);
                if (fileRef.current) fileRef.current.value = '';
                window.setTimeout(() => setMessage(''), 1800);
            });
    };

    const toggleAvailability = () => {
        if (!isSuperAdmin || saving) return;
        const next = !manualUnavailable;
        setSaving(true);
        window.axios.post(route('cards.quickAvailability', card.id), {
            manualUnavailable: next,
            availabilityNote: next ? 'غير متوفر حاليًا' : '',
        }).then(() => {
            setManualUnavailable(next);
            setMessage(next ? 'تم وضعه غير متوفر' : 'تم تفعيله');
        }).catch((error) => setMessage(error.response?.data?.message || 'تعذر تحديث الحالة'))
            .finally(() => {
                setSaving(false);
                window.setTimeout(() => setMessage(''), 1800);
            });
    };

    return (
        <div
            className={`group relative block w-full overflow-hidden rounded-[20px] border bg-white text-right shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)] dark:bg-slate-900 ${unavailable ? 'border-rose-200 opacity-85 dark:border-rose-900/70' : gift ? 'border-sky-200 dark:border-sky-900/70' : 'border-slate-200 hover:border-sky-200 dark:border-slate-800'} ${compact ? 'p-2' : 'p-2.5 sm:p-3'}`}
        >
            {unavailable && (
                <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-lg">
                    <AlertTriangle className="h-3.5 w-3.5" /> غير متوفر
                </div>
            )}
            <button type="button" onClick={handleClick} className="block w-full text-right" disabled={isSuperAdmin || unavailable}>
                <div className={`relative overflow-hidden rounded-[16px] ${gift ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    {gift && (
                        <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.34),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.30),transparent_30%)]" />
                            <div className="absolute left-2 top-2 z-10 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur">Gift Card</div>
                            <div className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-cyan-100 backdrop-blur">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </>
                    )}
                    {localIcon ? (
                        <img
                            loading="lazy"
                            decoding="async"
                            src={localIcon}
                            alt={card?.name}
                            className={`aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105 ${gift ? 'opacity-90 mix-blend-screen' : ''}`}
                        />
                    ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-sky-50 via-white to-violet-50 text-3xl dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 sm:text-4xl">
                            {gift ? <Gift className="h-10 w-10 text-cyan-300 sm:h-14 sm:w-14" /> : <span>🎮</span>}
                        </div>
                    )}
                </div>
                <div className="pt-2 sm:pt-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-950 dark:text-white sm:text-[15px]">{card?.name}</h3>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${gift ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {gift ? <Gift className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                        </span>
                    </div>
                    {card?.order_count > 0 && <div className="mt-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">الأكثر طلبًا • {card.order_count}</div>}
                    {gift && <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">كود رصيد داخلي يظهر ضمن طلباتي.</p>}
                    {!isSuperAdmin && (
                        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-black ${unavailable ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>
                            <BadgeDollarSign className="h-4 w-4" />
                            {unavailable ? 'غير متوفر' : `$${formatNumberPrecise(localPrice)}`}
                        </div>
                    )}
                </div>
            </button>

            {isSuperAdmin && (
                <form onSubmit={savePrice} data-no-global-edit="true" className="mt-3 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-200">
                        <Settings2 className="h-4 w-4" /> تعديل سريع للمنتج
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">سعر المزود / التكلفة</label>
                        <input type="number" step="0.00000001" min="0" value={providerCost} onChange={(event) => setProviderCost(event.target.value)} onClick={(event) => event.stopPropagation()} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">سعر البيع في المتجر</label>
                        <input type="number" step="0.00000001" min="0" value={localPrice} onChange={(event) => setLocalPrice(event.target.value)} onClick={(event) => event.stopPropagation()} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-black text-slate-700 dark:text-slate-200">ترتيب الظهور</label>
                            <button type="button" onClick={saveSortOrder} disabled={saving} className="rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                                حفظ الترتيب
                            </button>
                        </div>
                        <input type="number" step="1" value={localSortOrder} onChange={(event) => setLocalSortOrder(event.target.value)} onClick={(event) => event.stopPropagation()} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-black text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                        <div className="mt-1 text-[11px] font-bold leading-5 text-slate-500 dark:text-slate-400">1 يظهر أولًا، 2 ثانيًا. المنتجات ذات 0 تبقى بعد المنتجات المرتبة تلقائيًا.</div>
                    </div>

                    <div className="grid gap-2">
                        <input ref={fileRef} type="file" accept="image/*" onChange={saveImage} className="hidden" />
                        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-black text-sky-700 hover:bg-sky-50 dark:border-sky-900 dark:bg-slate-900 dark:text-sky-300">
                            <ImagePlus className="h-4 w-4" /> تغيير صورة المنتج
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60">
                            <Save className="h-4 w-4" /> {saving ? 'جارٍ الحفظ...' : 'حفظ السعر'}
                        </button>
                        <button type="button" onClick={toggleAvailability} disabled={saving} className={`rounded-xl px-4 py-2 text-xs font-black text-white ${manualUnavailable ? 'bg-sky-600 hover:bg-sky-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                            {manualUnavailable ? 'جعله متوفر' : 'جعله غير متوفر'}
                        </button>
                        {message && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{message}</span>}
                    </div>
                </form>
            )}
        </div>
    );
}

import { useMemo, useRef, useState } from 'react';
import { router, Link, useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, FileText, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';
import { formatNumberPrecise } from '@/lib/formatters';
import EditableText from '@/components/EditableText';

function makeClientRequestId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function BuyCardModal({ card, onClose }) {
    const { auth, flash, siteSettings = {} } = usePage().props;
    const [purchaseResult, setPurchaseResult] = useState(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const { t } = useSitePreferences();
    const providerOptionProductIds = card.provider_option_product_ids || {};
    const usesMappedProviderOptions = Object.keys(providerOptionProductIds).length > 0;
    const allowedValues = Array.isArray(card.provider_qty_values) ? card.provider_qty_values.map((v) => String(v)) : null;
    const minAmount = Number(card.minAmount ?? 1);
    const maxAmount = Number(card.maxAmount ?? minAmount);
    const quantityLabel = card.quantity_label || t.chooseQuantity;
    const playerIdLabel = card.player_id_label || 'معرّف اللاعب';
    const requiresPlayerId = Boolean(card.requires_player_id);
    const requiresSecondaryId = Boolean(card.requires_secondary_player_id);
    const secondaryPlayerIdLabel = card.secondary_player_id_label || 'Server / Secondary ID';
    const specialDiscount = Number(auth.user?.special_price_discount_percentage || 0);
    const basePrice = Number(card.price || 0);
    const purchaseFlow = card.purchase_flow || 'direct_purchase';
    const optionPrices = card.option_prices || {};
    const isInternalGiftCard = card.delivery_mode === 'internal_gift_card';
    const isManual = !isInternalGiftCard && (card.delivery_mode === 'manual_review' || (!card.sawaCardId && !usesMappedProviderOptions));
    const productNotes = String(card.notes || card.description || '').trim();
    const hasLongNotes = productNotes.length > 120;

    const initialProviderValue = allowedValues?.length ? allowedValues[0] : String(Math.max(1, minAmount || 1));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLockRef = useRef(false);
    const clientRequestIdRef = useRef(makeClientRequestId());
    const [formErrors, setFormErrors] = useState({});
    const { data, setData, errors } = useForm({
        cardId: card.id,
        amount: purchaseFlow === 'codes_quantity' ? 1 : Math.max(1, minAmount || 1),
        userId: '',
        secondaryUserId: '',
        providerValue: initialProviderValue,
    });

    const selectedOptionPrice = useMemo(() => {
        const optionPrice = optionPrices?.[String(data.providerValue)];
        const base = optionPrice !== undefined ? Number(optionPrice) : basePrice;
        return Math.max(0, base * (1 - specialDiscount / 100));
    }, [optionPrices, data.providerValue, basePrice, specialDiscount]);

    const formatMoney = (value) => formatNumberPrecise(value);

    const totalValue = useMemo(() => {
        if (purchaseFlow === 'codes_quantity') {
            return selectedOptionPrice * Number(data.amount || 1);
        }

        if (purchaseFlow === 'player_custom_value') {
            return selectedOptionPrice * Number(data.amount || Math.max(1, minAmount || 1));
        }

        return selectedOptionPrice;
    }, [purchaseFlow, selectedOptionPrice, data.amount, minAmount]);

    const total = useMemo(() => formatMoney(totalValue), [totalValue]);
    const displayedErrors = { ...errors, ...formErrors };

    const updateAmount = (value) => {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) return;
        if (purchaseFlow === 'codes_quantity') {
            setData('amount', Math.max(1, numericValue));
            return;
        }
        if (!maxAmount) {
            setData('amount', Math.max(minAmount || 1, numericValue));
            return;
        }
        setData('amount', Math.min(maxAmount, Math.max(minAmount || 1, numericValue)));
    };

    const submit = async (event) => {
        event.preventDefault();

        if (isSubmitting || submitLockRef.current) {
            return;
        }

        submitLockRef.current = true;
        setIsSubmitting(true);
        setFormErrors({});
        setPurchaseResult(null);

        try {
            if (typeof window.refreshCsrfToken === 'function') {
                await window.refreshCsrfToken();
            }
        } catch (_) {
            // الشراء سيحاول بالجلسة الحالية، وإذا انتهت ستظهر رسالة آمنة بدل صفحة 419.
        }

        if (!card?.id) {
            setPurchaseResult({
                type: 'error',
                title: `تعذر إنشاء الطلب`,
                message: 'معرّف المنتج غير موجود.',
            });
            submitLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        if (requiresPlayerId && !String(data.userId || '').trim()) {
            setFormErrors({ userId: 'هذا المنتج يتطلب إدخال معرف اللاعب أو الحساب.' });
            submitLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        if (requiresSecondaryId && !String(data.secondaryUserId || '').trim()) {
            setFormErrors({ secondaryUserId: 'هذا المنتج يتطلب إدخال المعرّف الثاني أو السيرفر.' });
            submitLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        const currentBalance = Number(auth.user?.balance || 0);
        if (Number.isFinite(totalValue) && currentBalance + 0.00000001 < Number(totalValue || 0)) {
            setPurchaseResult({
                type: 'error',
                title: `الرصيد غير كافٍ`,
                message: `رصيدك الحالي $${formatMoney(currentBalance)}، وسعر الطلب $${formatMoney(totalValue)}. يرجى شحن الرصيد ثم المحاولة من جديد.`,
            });
            submitLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        router.post(
            route('user.buyCard', auth.user.id),
            {
                card: { id: card.id },
                amount: data.amount,
                userId: data.userId,
                secondaryUserId: data.secondaryUserId,
                providerValue: data.providerValue,
                clientRequestId: clientRequestIdRef.current,
            },
            {
                preserveScroll: true,
                onStart: () => {
                    submitLockRef.current = true;
                    setIsSubmitting(true);
                },
                onError: (responseErrors) => {
                    if (responseErrors?.status === 419 || responseErrors?.message === 'Page Expired') {
                        setPurchaseResult({
                            type: 'error',
                            title: `انتهت الجلسة`,
                            message: 'تم تحديث جلسة الحماية. حدّث الصفحة وحاول الشراء مرة ثانية، ولن يتم خصم أي رصيد من العملية غير المكتملة.',
                        });
                        return;
                    }

                    const normalizedErrors = responseErrors || {};
                    setFormErrors(normalizedErrors);

                    const firstError = Object.values(normalizedErrors)[0];
                    setPurchaseResult({
                        type: 'error',
                        title: `تعذر إنشاء الطلب`,
                        message: firstError
                            ? (Array.isArray(firstError) ? firstError[0] : firstError)
                            : 'فشل تنفيذ عملية الشراء. تأكد من الرصيد والبيانات المطلوبة ثم حاول مرة أخرى.',
                    });
                },
                onSuccess: (page) => {
                    const pageFlash = page?.props?.flash || {};
                    const pageErrors = page?.props?.errors || {};

                    if (pageFlash.error || Object.keys(pageErrors).length) {
                        const firstError = pageFlash.error || Object.values(pageErrors)[0];
                        setFormErrors(pageErrors || {});
                        setPurchaseResult({
                            type: 'error',
                            title: `تعذر إنشاء الطلب`,
                            message: Array.isArray(firstError) ? firstError[0] : (firstError || 'فشل تنفيذ عملية الشراء.'),
                        });
                        return;
                    }

                    const warning = pageFlash.warning;
                    const success = pageFlash.success;

                    setPurchaseResult({
                        type: warning ? 'warning' : 'success',
                        title: warning ? `تم إنشاء الطلب مع ملاحظة` : `تم إنشاء الطلب بنجاح`,
                        message: warning || success || `تم إنشاء الطلب ويمكنك رؤية تفاصيله من صفحة طلباتي.`,
                    });
                },
                onException: (error) => {
                    if (error?.response?.status === 419) {
                        setPurchaseResult({
                            type: 'error',
                            title: `انتهت الجلسة`,
                            message: 'تم تحديث جلسة الحماية. حدّث الصفحة وحاول الشراء مرة ثانية، ولن يتم خصم أي رصيد من العملية غير المكتملة.',
                        });
                        return false;
                    }
                    return true;
                },
                onCancel: () => {
                    setPurchaseResult({
                        type: 'error',
                        title: 'تم إلغاء الطلب',
                        message: 'تم إلغاء عملية الشراء قبل اكتمالها.',
                    });
                },
                onFinish: () => {
                    submitLockRef.current = false;
                    setIsSubmitting(false);
                },
            }
        );
    };

    if (purchaseResult) {
        const isError = purchaseResult.type === 'error';

        return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-2 backdrop-blur-sm sm:items-center sm:p-4">
                <div className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 text-right shadow-[0_35px_90px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            {isError ? (
                                <BadgeCheck className="h-8 w-8 text-rose-500" />
                            ) : (
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            )}
                            <div>
                                <div className="text-xl font-black text-slate-950 dark:text-white">{purchaseResult.title}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{purchaseResult.message}</div>
                            </div>
                        </div>
                    </div>

                    {!isError ? (
                        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                            تم إنشاء الطلب. إذا كان المنتج Gift Card ستجد الكود مباشرة داخل صفحة طلباتي ويمكنك استرداده من زر Gift Card.
                        </div>
                    ) : (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                            لم يتم إنشاء الطلب. راجع الرسالة أعلاه ثم حاول مرة أخرى.
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" className="rounded-2xl" onClick={() => { clientRequestIdRef.current = makeClientRequestId(); submitLockRef.current = false; setIsSubmitting(false); setPurchaseResult(null); }}>
                            <ShoppingCart className="ml-2 h-4 w-4" />
                            شراء منتج آخر
                        </Button>

                        <Link href={route('user.payments', auth.user.id)} className="inline-flex">
                            <Button type="button" className="rounded-2xl bg-sky-600 hover:bg-sky-700">
                                الذهاب إلى طلباتي
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[96vh] w-full max-w-2xl overflow-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <aside className="border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-3 text-right dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5" />
                            </button>
                            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                                <div className="min-w-0 text-right">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.confirmPurchase}</div>
                                    <div className="truncate text-lg font-black text-slate-950 dark:text-white sm:text-xl">{card.name}</div>
                                    <div className="mt-1 text-sm font-black text-sky-700 dark:text-sky-300">${formatMoney(selectedOptionPrice)}</div>
                                </div>
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800">
                                    {card.icon ? <img src={card.icon} alt={card.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" /> : <span className="text-2xl">💳</span>}
                                </div>
                            </div>
                        </div>

                    </aside>

                    <div className="p-3 sm:p-5">
                        <form onSubmit={submit} className="space-y-3 text-right sm:space-y-4">
                            {(flash?.error || flash?.warning || flash?.success || displayedErrors.card || displayedErrors.amount || displayedErrors.userId || displayedErrors.secondaryUserId || displayedErrors.providerValue) && (
                                <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${flash?.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200' : flash?.warning ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200'}`}>
                                    {flash?.error || flash?.warning || flash?.success || displayedErrors.card || displayedErrors.amount || displayedErrors.userId || displayedErrors.secondaryUserId || displayedErrors.providerValue}
                                </div>
                            )}

                            {requiresPlayerId && (
                                <div>
                                    <Label htmlFor="userId" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">{playerIdLabel}</Label>
                                    <Input id="userId" type="text" value={data.userId} disabled={isSubmitting} onChange={(event) => setData('userId', event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={`${playerIdLabel}`} />
                                    {displayedErrors.userId && <div className="mt-2 text-sm text-rose-600">{displayedErrors.userId}</div>}
                                </div>
                            )}

                            {requiresSecondaryId && (
                                <div>
                                    <Label htmlFor="secondaryUserId" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">{secondaryPlayerIdLabel}</Label>
                                    <Input id="secondaryUserId" type="text" value={data.secondaryUserId} disabled={isSubmitting} onChange={(event) => setData('secondaryUserId', event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={`${secondaryPlayerIdLabel}`} />
                                    {displayedErrors.secondaryUserId && <div className="mt-2 text-sm text-rose-600">{displayedErrors.secondaryUserId}</div>}
                                </div>
                            )}

                            {allowedValues?.length > 1 && ['player_category', 'codes_quantity', 'player_and_server', 'direct_purchase'].includes(purchaseFlow) && (
                                <div>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t.categoryButtonsHint}</span>
                                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">{t.chooseCategory}</Label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {allowedValues.map((value) => {
                                            const isSelected = String(data.providerValue) === String(value);
                                            return (
                                                <button
                                                    type="button"
                                                    key={value}
                                                    disabled={isSubmitting} onClick={() => setData('providerValue', String(value))}
                                                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${isSelected ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}
                                                >
                                                    <span className="block">{isInternalGiftCard ? `$${value}` : value}</span>
                                                    {optionPrices?.[String(value)] !== undefined && (
                                                        <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">${formatMoney(Number(optionPrices[String(value)]))}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {displayedErrors.providerValue && <div className="mt-2 text-sm text-rose-600">{displayedErrors.providerValue}</div>}
                                </div>
                            )}

                            {purchaseFlow === 'codes_quantity' && (
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{isInternalGiftCard ? 'عدد البطاقات المطلوبة' : 'عدد النسخ المطلوبة'}</span>
                                        <Label htmlFor="amount" className="text-sm font-semibold text-slate-900 dark:text-white">{t.chooseQuantity}</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => updateAmount(Number(data.amount || 1) + 1)} className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"><Plus className="h-4 w-4" /></Button>
                                        <Input id="amount" type="number" min={1} value={data.amount} disabled={isSubmitting} onChange={(event) => updateAmount(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-white text-center text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => updateAmount(Number(data.amount || 1) - 1)} className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"><Minus className="h-4 w-4" /></Button>
                                    </div>
                                    {displayedErrors.amount && <div className="mt-2 text-sm text-rose-600">{displayedErrors.amount}</div>}
                                </div>
                            )}

                            {purchaseFlow === 'player_custom_value' && (
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        {(minAmount > 0 || maxAmount > 0) ? <span className="text-xs text-slate-500 dark:text-slate-400">{minAmount}{maxAmount ? ` - ${maxAmount}` : ''}</span> : <span />}
                                        <Label htmlFor="amount" className="text-sm font-semibold text-slate-900 dark:text-white">{quantityLabel}</Label>
                                    </div>
                                    <Input id="amount" type="number" min={minAmount || 1} max={maxAmount || undefined} value={data.amount} disabled={isSubmitting} onChange={(event) => updateAmount(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-white text-center text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                    {displayedErrors.amount && <div className="mt-2 text-sm text-rose-600">{displayedErrors.amount}</div>}
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-3 rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-3 text-right dark:border-sky-900/40 dark:bg-sky-950/20">
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.totalPrice}</div>
                                <div className="text-xl font-black text-sky-700 dark:text-sky-200">${total}</div>
                            </div>

                            {productNotes && (
                                <div className="rounded-[18px] border border-slate-200 bg-white p-3 text-right dark:border-slate-700 dark:bg-slate-900">
                                    <button type="button" onClick={() => setNotesOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-sm font-black text-slate-950 dark:text-white">
                                        <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-sky-600" /> ملاحظات المنتج</span>
                                        {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    <div className={`mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300 ${notesOpen ? '' : 'line-clamp-2'}`}>
                                        {productNotes}
                                    </div>
                                    {hasLongNotes && !notesOpen && <div className="mt-1 text-xs font-bold text-sky-600">اضغط السهم لقراءة كامل الملاحظات</div>}
                                </div>
                            )}

                            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-violet-400">
                                {isSubmitting ? 'جارٍ تنفيذ الطلب...' : t.purchaseNow}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';
import { formatNumberPrecise } from '@/lib/formatters';

const FLOWS_WITH_OPTIONS = ['player_category', 'codes_quantity', 'player_and_server'];

function sectionLabel(section, allSections) {
    if (!section?.section_id) return section?.name || '';
    const parent = allSections.find((item) => Number(item.id) === Number(section.section_id));
    return parent ? `${parent.name} / ${section.name}` : section.name;
}

function createOptionRow(value = '', price = '', cost = '', productId = '') {
    return { id: `${Date.now()}-${Math.random()}`, value: String(value), price: String(price), cost: String(cost), productId: String(productId) };
}

function rowsToPayload(rows) {
    const values = [];
    const prices = {};
    const costs = {};
    const productIds = {};
    rows.forEach((row) => {
        const key = String(row.value || '').trim();
        if (!key) return;
        values.push(key);
        if (row.price !== '') prices[key] = Number(row.price || 0);
        if (row.cost !== '') costs[key] = Number(row.cost || 0);
        if (row.productId !== '') productIds[key] = String(row.productId).trim();
    });
    return { values, prices, costs, productIds };
}

export default function Create({ sections = [], subcategories = [], providerSources = [], initialSectionId = '', globalMarkupPercentage = 0 }) {
    const { t } = useSitePreferences();
    const [optionRows, setOptionRows] = useState([createOptionRow()]);
    const { data, setData, post, processing, errors } = useForm({
        name: '', description: '', sortOrder: 0, price: '', costPrice: '', providerCostPrice: '', priceAdjustmentPercentage: 0, profitPercentage: globalMarkupPercentage ?? 0,
        isActive: 1, sectionId: initialSectionId || '', subcategoryId: '', icon: null, providerSourceId: providerSources[0]?.id || '',
        sawaCardId: '', providerProductId: '', minAmount: '', maxAmount: '', discount: 0, backgroundImage: null,
        requiresPlayerId: 1, playerIdLabel: 'معرّف اللاعب', quantityLabel: 'الفئة', amountMode: 'quantity', deliveryMode: 'manual_review', providerProductType: 'manual',
        providerQtyValues: '', providerParams: '', purchaseFlow: 'player_category', requiresSecondaryPlayerId: 0, secondaryPlayerIdLabel: 'السيرفر / المعرّف الثاني',
        optionPrices: '', optionCosts: '', providerOptionProductIds: '',
    });

    const preview = useMemo(() => {
        const base = Number(data.providerCostPrice || data.costPrice || 0);
        const profit = Number(data.profitPercentage || 0);
        const suggested = base > 0 ? base * (1 + profit / 100) : Number(data.price || 0);
        return { base, suggested, margin: Math.max(0, Number(data.price || suggested) - base) };
    }, [data.providerCostPrice, data.costPrice, data.profitPercentage, data.price]);

    const applyFlowRules = (flow) => {
        setData('purchaseFlow', flow);
        setData('requiresSecondaryPlayerId', flow === 'player_and_server' ? 1 : 0);
        setData('requiresPlayerId', flow === 'codes_quantity' ? 0 : 1);
        setData('amountMode', flow === 'player_custom_value' ? 'custom_value' : 'quantity');
        setData('quantityLabel', flow === 'player_custom_value' ? 'القيمة' : 'الفئة');
        setData('deliveryMode', flow === 'direct_purchase' ? 'manual_review' : flow === 'player_custom_value' ? 'api_topup' : 'api_codes');
        setData('providerProductType', flow === 'player_custom_value' ? 'amount' : 'manual');
        if (flow !== 'player_custom_value') {
            setData('minAmount', '');
            setData('maxAmount', '');
        }
    };

    const handleProfitChange = (value) => {
        setData('profitPercentage', value);
        const base = Number(data.providerCostPrice || data.costPrice || 0);
        if (base > 0 && value !== '') setData('price', (base * (1 + Number(value || 0) / 100)).toFixed(6));
    };

    const addOptionRow = () => setOptionRows((rows) => [...rows, createOptionRow()]);
    const removeOptionRow = (id) => setOptionRows((rows) => rows.filter((row) => row.id !== id));
    const updateOptionRow = (id, field, value) => setOptionRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

    const submit = (e) => {
        e.preventDefault();
        if (FLOWS_WITH_OPTIONS.includes(data.purchaseFlow)) {
            const payload = rowsToPayload(optionRows);
            setData('providerQtyValues', payload.values.length ? JSON.stringify(payload.values) : '');
            setData('optionPrices', Object.keys(payload.prices).length ? JSON.stringify(payload.prices) : '');
            setData('optionCosts', Object.keys(payload.costs).length ? JSON.stringify(payload.costs) : '');
            setData('providerOptionProductIds', Object.keys(payload.productIds).length ? JSON.stringify(payload.productIds) : '');
        }
        post(route('card.store'));
    };

    return (
        <AdminLayout title="إضافة منتج يدوي">
            <Head title="إضافة منتج" />
            <div className="mx-auto max-w-6xl rounded-[30px] border border-slate-200 bg-white p-6 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">استخدم هذه الصفحة للإضافة اليدوية أو تعديل الأسعار فقط. استيراد منتجات Shams و Sawa صار من مركز الاستيراد.</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="purchaseFlow" className="mb-2 block">{t.purchaseDisplayMode}</Label>
                                    <select id="purchaseFlow" value={data.purchaseFlow} onChange={(e) => applyFlowRules(e.target.value)} className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                                        <option value="player_category">اختيار فئة ثم ID</option><option value="codes_quantity">اختيار فئة ثم عدد</option><option value="player_custom_value">ID + قيمة مرنة</option><option value="player_and_server">ID + ID ثاني / سيرفر</option><option value="direct_purchase">شراء مباشر</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="sectionId" className="mb-2 block">{t.section}</Label>
                                    <select id="sectionId" value={data.sectionId} onChange={(e) => setData('sectionId', e.target.value)} className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                                        <option value="">بدون قسم</option>{sections.map((section) => <option key={section.id} value={section.id}>{sectionLabel(section, sections)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div><Label htmlFor="subcategoryId" className="mb-2 block">{t.categoryGroup}</Label><select id="subcategoryId" value={data.subcategoryId} onChange={(e) => setData('subcategoryId', e.target.value)} className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="">بدون قسم داخلي</option>{subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></div>
                                <div><Label htmlFor="name" className="mb-2 block">اسم المنتج</Label><Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />{errors.name && <div className="mt-1 text-sm text-red-500">{errors.name}</div>}</div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="description" className="mb-2 block">الوصف المختصر</Label><Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} /></div><div><Label htmlFor="sortOrder" className="mb-2 block">ترتيب الظهور</Label><Input id="sortOrder" type="number" value={data.sortOrder} onChange={(e) => setData('sortOrder', e.target.value)} /><div className="mt-1 text-xs text-slate-500">الأصغر يظهر أولًا.</div></div></div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div><Label htmlFor="providerCostPrice" className="mb-2 block">{t.baseCost}</Label><Input id="providerCostPrice" type="number" step="0.01" value={data.providerCostPrice} onChange={(e) => { setData('providerCostPrice', e.target.value); setData('costPrice', e.target.value); }} /></div>
                                <div><Label htmlFor="profitPercentage" className="mb-2 block">{t.profitRate}</Label><Input id="profitPercentage" type="number" step="0.01" value={data.profitPercentage} onChange={(e) => handleProfitChange(e.target.value)} /></div>
                                <div><Label htmlFor="price" className="mb-2 block">{t.salePrice}</Label><Input id="price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} /></div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div><Label htmlFor="playerIdLabel" className="mb-2 block">{t.primaryIdLabel}</Label><Input id="playerIdLabel" value={data.playerIdLabel} onChange={(e) => setData('playerIdLabel', e.target.value)} /></div>
                                <div><Label htmlFor="quantityLabel" className="mb-2 block">اسم حقل الفئة / العدد / القيمة</Label><Input id="quantityLabel" value={data.quantityLabel} onChange={(e) => setData('quantityLabel', e.target.value)} /></div>
                            </div>
                            {data.purchaseFlow === 'player_and_server' && <div><Label htmlFor="secondaryPlayerIdLabel" className="mb-2 block">{t.secondaryIdLabel}</Label><Input id="secondaryPlayerIdLabel" value={data.secondaryPlayerIdLabel} onChange={(e) => setData('secondaryPlayerIdLabel', e.target.value)} /></div>}
                            {FLOWS_WITH_OPTIONS.includes(data.purchaseFlow) && <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50"><div className="flex items-center justify-between"><Button type="button" variant="outline" onClick={addOptionRow}>{t.addOption}</Button><div className="text-sm font-bold text-slate-900 dark:text-white">الفئات والأسعار</div></div><div className="space-y-3">{optionRows.map((row, index) => <div key={row.id} className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"><Input value={row.value} onChange={(e) => updateOptionRow(row.id, 'value', e.target.value)} placeholder={`${t.optionName} ${index + 1}`} /><Input type="number" step="0.01" value={row.price} onChange={(e) => updateOptionRow(row.id, 'price', e.target.value)} placeholder={t.optionPrice} /><Input type="number" step="0.01" value={row.cost} onChange={(e) => updateOptionRow(row.id, 'cost', e.target.value)} placeholder={t.optionCost} /><Input value={row.productId} onChange={(e) => updateOptionRow(row.id, 'productId', e.target.value)} placeholder="ID المزود" /><Button type="button" variant="outline" onClick={() => removeOptionRow(row.id)} disabled={optionRows.length === 1}>{t.remove}</Button></div>)}</div></div>}
                            {data.purchaseFlow === 'player_custom_value' && <div className="grid gap-6 md:grid-cols-2"><div><Label htmlFor="minAmount" className="mb-2 block">الحد الأدنى</Label><Input id="minAmount" type="number" value={data.minAmount} onChange={(e) => setData('minAmount', e.target.value)} /></div><div><Label htmlFor="maxAmount" className="mb-2 block">الحد الأعلى</Label><Input id="maxAmount" type="number" value={data.maxAmount} onChange={(e) => setData('maxAmount', e.target.value)} /></div></div>}
                            <div className="grid gap-6 md:grid-cols-2"><div><Label htmlFor="icon" className="mb-2 block">أيقونة المنتج</Label><Input id="icon" type="file" onChange={(e) => setData('icon', e.target.files[0])} accept="image/*" /></div><div><Label htmlFor="backgroundImage" className="mb-2 block">صورة الخلفية</Label><Input id="backgroundImage" type="file" onChange={(e) => setData('backgroundImage', e.target.files[0])} accept="image/*" /></div></div>
                            <div><Label htmlFor="isActive" className="mb-2 block">الحالة</Label><select id="isActive" value={data.isActive} onChange={(e) => setData('isActive', Number(e.target.value))} className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"><option value={1}>نشط</option><option value={0}>معطل</option></select></div>
                        </div>
                        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60"><div className="text-sm font-bold text-slate-900 dark:text-white">ملخص التسعير</div><div className="rounded-2xl bg-white p-4 dark:bg-slate-900"><div className="text-sm text-slate-500">سعر التكلفة</div><div className="mt-1 text-2xl font-black text-slate-950 dark:text-white">${formatNumberPrecise(preview.base)}</div></div><div className="rounded-2xl bg-white p-4 dark:bg-slate-900"><div className="text-sm text-slate-500">السعر المقترح</div><div className="mt-1 text-2xl font-black text-emerald-600">${formatNumberPrecise(preview.suggested)}</div></div><div className="rounded-2xl bg-white p-4 dark:bg-slate-900"><div className="text-sm text-slate-500">الهامش الحالي</div><div className="mt-1 text-2xl font-black text-sky-600">${formatNumberPrecise(preview.margin)}</div></div><div className="flex flex-col gap-3 pt-2"><Button type="submit" disabled={processing} className="rounded-2xl">{processing ? 'جارٍ الحفظ...' : 'حفظ المنتج'}</Button><Link href={route('card.index')}><Button type="button" variant="outline" className="w-full rounded-2xl">رجوع</Button></Link></div></div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

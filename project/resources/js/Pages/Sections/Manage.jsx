import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, FolderPlus, Layers3, MoveRight, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { formatNumberPrecise } from '@/lib/formatters';

function Money({ value }) {
    const amount = Number(value || 0);
    return <span>{formatNumberPrecise(value)}</span>;
}

export default function Manage({ section, subSections = [], cards = [], cardFilters = {}, sectionOptions = [] }) {
    const { delete: destroy } = useForm();
    const cardsList = useMemo(() => (Array.isArray(cards) ? cards : (cards?.data || [])), [cards]);
    const cardLinks = !Array.isArray(cards) ? (cards?.links || []) : [];
    const [cardSearch, setCardSearch] = useState(cardFilters?.search || '');
    const [pricing, setPricing] = useState(() => Object.fromEntries(cardsList.map((card) => [card.id, { price: card.price, costPrice: card.cost_price || 0 }])));
    const [savingCardId, setSavingCardId] = useState(null);
    const [movingCardId, setMovingCardId] = useState(null);
    const [sortingCardId, setSortingCardId] = useState(null);
    const [moveTargets, setMoveTargets] = useState(() => Object.fromEntries(cardsList.map((card) => [card.id, card.section_id || section.id])));
    const [sortOrders, setSortOrders] = useState(() => Object.fromEntries(cardsList.map((card) => [card.id, card.sort_order || 0])));

    useEffect(() => {
        setPricing(Object.fromEntries(cardsList.map((card) => [card.id, { price: card.price, costPrice: card.cost_price || 0 }])));
        setMoveTargets(Object.fromEntries(cardsList.map((card) => [card.id, card.section_id || section.id])));
        setSortOrders(Object.fromEntries(cardsList.map((card) => [card.id, card.sort_order || 0])));
    }, [cardsList, section.id]);

    const handleDeleteSection = (id) => {
        if (confirm('هل تريد حذف هذا القسم؟')) {
            destroy(route('sections.destroy', id));
        }
    };

    const handleDeleteCard = (id) => {
        if (confirm('هل تريد حذف هذا المنتج؟')) {
            destroy(route('card.destroy', id));
        }
    };


    const applyCardSearch = (event) => {
        event.preventDefault();
        router.get(route('sections.manage', section.id), { card_search: cardSearch }, { preserveScroll: true, preserveState: true });
    };

    const clearCardSearch = () => {
        setCardSearch('');
        router.get(route('sections.manage', section.id), {}, { preserveScroll: true, preserveState: true });
    };

    const updatePricingField = (cardId, field, value) => {
        setPricing((current) => ({
            ...current,
            [cardId]: {
                ...(current[cardId] || {}),
                [field]: value,
            },
        }));
    };

    const saveQuickPricing = (cardId) => {
        setSavingCardId(cardId);
        router.post(route('card.quickPricing', cardId), pricing[cardId], {
            preserveScroll: true,
            onFinish: () => setSavingCardId(null),
        });
    };

    const updateMoveTarget = (cardId, sectionId) => {
        setMoveTargets((current) => ({
            ...current,
            [cardId]: Number(sectionId),
        }));
    };


    const updateSortOrder = (cardId, value) => {
        setSortOrders((current) => ({
            ...current,
            [cardId]: value,
        }));
    };

    const saveSortOrder = (cardId) => {
        setSortingCardId(cardId);
        router.post(route('card.quickSort', cardId), { sortOrder: Number(sortOrders[cardId] || 0) }, {
            preserveScroll: true,
            onFinish: () => setSortingCardId(null),
        });
    };

    const moveCard = (cardId) => {
        const sectionId = Number(moveTargets[cardId]);

        if (!sectionId) {
            alert('اختر القسم الهدف أولًا.');
            return;
        }

        setMovingCardId(cardId);
        router.post(route('card.moveSection', cardId), { sectionId }, {
            preserveScroll: true,
            onFinish: () => setMovingCardId(null),
        });
    };

    return (
        <AdminLayout title={`إدارة محتوى القسم: ${section.name}`}>
            <Head title={`إدارة ${section.name}`} />

            <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-right">
                            <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <Link href={route('sections.indexAdmin')} className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">الأقسام الرئيسية</Link>
                                {section.parent && <><span>/</span><Link href={route('sections.manage', section.parent.id)} className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">{section.parent.name}</Link></>}
                                <span>/</span>
                                <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">{section.name}</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{section.name}</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                                هذا القسم يدعم الحالتين معًا: إضافة منتجات مباشرة داخله، أو إضافة أقسام فرعية تحتوي منتجات خاصة بها. يمكنك نقل أي منتج لقسم آخر من جدول المنتجات مباشرة.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <Link href={route('sections.subSection.create', section.id)}><Button className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white"><FolderPlus className="ml-2 h-4 w-4" />إضافة قسم فرعي</Button></Link>
                            <Link href={route('sections.card.create', section.id)}><Button className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white"><Plus className="ml-2 h-4 w-4" />إضافة منتج مباشر</Button></Link>
                            <Link href={route('sections.edit', section.id)}><Button variant="outline" className="rounded-2xl"><Pencil className="ml-2 h-4 w-4" />تعديل القسم</Button></Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white"><Layers3 className="h-5 w-5" /><h2 className="text-lg font-black">الأقسام الفرعية داخل هذا القسم</h2></div>
                        <Link href={route('sections.subSection.create', section.id)}><Button className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white">إضافة قسم فرعي</Button></Link>
                    </div>
                    {subSections.length ? (
                        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                            {subSections.map((item) => (
                                <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-right dark:border-slate-700 dark:bg-slate-800/70">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-950 dark:text-white">{item.name}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description || 'بدون وصف حالياً.'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">{item.icon ? <img src={item.icon} alt={item.name} className="h-10 w-10 object-contain" /> : <FolderPlus className="h-8 w-8 text-violet-500" />}</div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap justify-end gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">منتجات مباشرة: {item.cards_count || 0}</span>
                                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">أقسام أعمق: {item.sub_sections_count || 0}</span>
                                    </div>
                                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                                        <Link href={route('sections.manage', item.id)}><Button className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white">إدارة المحتوى</Button></Link>
                                        <Link href={route('sections.edit', item.id)}><Button variant="outline" className="rounded-2xl">تعديل</Button></Link>
                                        <Button variant="destructive" className="rounded-2xl" onClick={() => handleDeleteSection(item.id)}><Trash2 className="ml-2 h-4 w-4" /> حذف</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد أقسام فرعية بعد داخل هذا القسم.</div>}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-right text-slate-900 dark:text-white">
                            <div className="flex items-center justify-end gap-2"><ShoppingBag className="h-5 w-5" /><h2 className="text-lg font-black">المنتجات المباشرة داخل هذا القسم</h2></div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">يتم تحميل 25 منتج فقط بكل صفحة. المنتجات ذات ترتيب 1 ثم 2 تظهر أولًا، أما ترتيب 0 فيبقى تلقائيًا بعد المنتجات المثبتة.</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <form onSubmit={applyCardSearch} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={cardSearch}
                                    onChange={(event) => setCardSearch(event.target.value)}
                                    placeholder="ابحث ضمن منتجات هذا القسم"
                                    className="h-10 w-56 rounded-2xl border border-slate-200 bg-white px-4 text-right text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                                <Button type="submit" variant="outline" className="rounded-2xl">بحث</Button>
                                {cardFilters?.search && <Button type="button" variant="ghost" className="rounded-2xl" onClick={clearCardSearch}>مسح</Button>}
                            </form>
                            <Link href={route('sections.card.create', section.id)}><Button className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white">إضافة منتج مباشر</Button></Link>
                        </div>
                    </div>

                    {cardsList.length ? (
                        <div className="sh7nle-mobile-scroll">
                            <table className="w-full min-w-[980px] text-right text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">المنتج</th>
                                        <th className="px-6 py-4">سعر البيع</th>
                                        <th className="px-6 py-4">سعر التكلفة</th>
                                        <th className="px-6 py-4">ترتيب الظهور</th>
                                        <th className="px-6 py-4">المزود</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4">نقل المنتج</th>
                                        <th className="px-6 py-4 text-left">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {cardsList.map((card) => {
                                        const currentPricing = pricing[card.id] || { price: card.price, costPrice: card.cost_price || 0 };
                                        const price = Number(currentPricing.price || 0);
                                        const cost = Number(currentPricing.costPrice || 0);
                                        const belowCost = price > 0 && cost > 0 && price < cost;
                                        return (
                                            <tr key={card.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 align-top">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-950 dark:text-white">{card.name}</div>
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.provider_product_id ? `Provider ID: ${card.provider_product_id}` : 'منتج داخلي/يدوي'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input type="number" step="0.01" value={currentPricing.price} onChange={(e) => updatePricingField(card.id, 'price', e.target.value)} className={`w-28 rounded-xl border px-3 py-2 text-right ${belowCost ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-900'}`} />
                                                    <div className="mt-2 text-xs font-bold text-emerald-600"><Money value={currentPricing.price} /></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input type="number" step="0.01" value={currentPricing.costPrice} onChange={(e) => updatePricingField(card.id, 'costPrice', e.target.value)} className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-slate-900" />
                                                    {belowCost && <div className="mt-2 text-xs font-bold text-rose-600">تحذير: السعر أقل من التكلفة</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex min-w-[150px] items-center gap-2">
                                                        <input type="number" value={sortOrders[card.id] ?? 0} onChange={(e) => updateSortOrder(card.id, e.target.value)} className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-slate-900" />
                                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => saveSortOrder(card.id)} disabled={sortingCardId === card.id}>{sortingCardId === card.id ? '...' : 'حفظ'}</Button>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">1 ثم 2 يظهران أولًا، و0 تلقائي بعد المثبت</div>
                                                </td>
                                                <td className="px-6 py-4">{card.provider_source_id ? `#${card.provider_source_id}` : 'بدون مزود'}</td>
                                                <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${card.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>{card.is_active ? 'نشط' : 'مخفي'}</span></td>
                                                <td className="px-6 py-4">
                                                    <div className="min-w-[270px] rounded-2xl border border-sky-100 bg-sky-50/70 p-3 dark:border-sky-900/50 dark:bg-sky-950/25">
                                                        <label className="mb-2 block text-xs font-black text-sky-700 dark:text-sky-300">انقل المنتج إلى قسم آخر</label>
                                                        <select
                                                            value={moveTargets[card.id] || card.section_id || section.id}
                                                            onChange={(event) => updateMoveTarget(card.id, event.target.value)}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        >
                                                            {sectionOptions.map((option) => (
                                                                <option key={option.id} value={option.id}>{option.path}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            size="sm"
                                                            className="mt-2 w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                                                            onClick={() => moveCard(card.id)}
                                                            disabled={movingCardId === card.id || Number(moveTargets[card.id] || card.section_id || section.id) === Number(card.section_id)}
                                                        >
                                                            <MoveRight className="ml-2 h-4 w-4" />
                                                            {movingCardId === card.id ? 'جارٍ النقل...' : 'نقل هنا'}
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap justify-start gap-2">
                                                        <Button className="rounded-2xl" onClick={() => saveQuickPricing(card.id)} disabled={savingCardId === card.id}>{savingCardId === card.id ? 'جارٍ الحفظ...' : 'حفظ السعر'}</Button>
                                                        <Link href={route('card.edit', card.id)}><Button variant="outline" className="rounded-2xl">تعديل كامل</Button></Link>
                                                        <Button variant="destructive" className="rounded-2xl" onClick={() => handleDeleteCard(card.id)}>حذف</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد منتجات مباشرة بعد داخل هذا القسم.</div>}

                    {cardLinks.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                            {cardLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`rounded-xl px-3 py-1.5 text-sm font-bold ${link.active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <div className="flex justify-end">
                    <Link href={route('sections.indexAdmin')}><Button variant="outline" className="rounded-2xl"><ArrowLeft className="ml-2 h-4 w-4" />رجوع إلى الأقسام الرئيسية</Button></Link>
                </div>
            </div>
        </AdminLayout>
    );
}

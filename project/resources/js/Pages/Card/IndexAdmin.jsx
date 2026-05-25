import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { formatNumberPrecise } from '@/lib/formatters';

export default function Index({ cards, sections = [], filters = {} }) {
    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    const [sectionId, setSectionId] = useState(filters.sectionId || '');

    const handleDelete = (id) => {
        if (confirm('هل تريد حذف هذا المنتج؟')) {
            destroy(route('card.destroy', id));
        }
    };

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('card.index'), {
            search: search || undefined,
            section_id: sectionId || undefined,
        }, { preserveScroll: true, preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setSectionId('');
        router.get(route('card.index'), {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <AdminLayout title="إدارة المنتجات">
            <Head title="إدارة المنتجات" />

            <div className="space-y-5">
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-slate-950 dark:text-white">إدارة المنتجات</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                لتخفيف الضغط على لوحة الإدارة، لا يتم تحميل كل المنتجات دفعة واحدة. اختر قسمًا أو ابحث عن منتج محدد، والنتائج مرتبة دائمًا من الأقل سعرًا للأعلى.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Link href={route('sections.indexAdmin')}>
                                <Button variant="outline" className="rounded-2xl">تصفح الأقسام</Button>
                            </Link>
                            <Link href={route('importedProducts.index', { root: 1 })}>
                                <Button variant="outline" className="rounded-2xl">مركز الاستيراد</Button>
                            </Link>
                            <Link href={route('card.create')}>
                                <Button className="rounded-2xl bg-purple-600 text-white hover:bg-purple-700">+ إضافة منتج يدوي</Button>
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={applyFilters} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
                        <select
                            value={sectionId || ''}
                            onChange={(event) => setSectionId(event.target.value)}
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-right text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">اختر قسمًا لعرض منتجاته</option>
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name} {section.cards_count ? `(${section.cards_count})` : ''}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="ابحث باسم المنتج أو ID المزود"
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-right text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <Button type="submit" className="h-12 rounded-2xl bg-sky-600 text-white hover:bg-sky-700">عرض المنتجات</Button>
                        <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={clearFilters}>مسح</Button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 text-right dark:border-slate-700">
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">النتائج</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">الصفحة تعرض 25 منتج فقط لتبقى الإدارة خفيفة وسريعة.</p>
                    </div>

                    {!filters.hasFilter ? (
                        <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            اختر قسمًا أو ابحث عن منتج حتى تظهر النتائج. لن يتم تحميل كل المنتجات تلقائيًا.
                        </div>
                    ) : cards.data.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد منتجات مطابقة.</div>
                    ) : (
                        <div className="sh7nle-mobile-scroll">
                            <table className="w-full min-w-[860px] text-right text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">الصورة</th>
                                        <th className="px-6 py-4">المنتج</th>
                                        <th className="px-6 py-4">القسم</th>
                                        <th className="px-6 py-4">السعر</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4 text-left">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {cards.data.map((card) => (
                                        <tr key={card.id} className="align-middle hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                {card.image ? <img src={card.image} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover" /> : <span className="text-2xl">🃏</span>}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-950 dark:text-white">{card.name}</td>
                                            <td className="px-6 py-4">{card.section?.name || '—'}</td>
                                            <td className="px-6 py-4 font-black text-emerald-600">${formatNumberPrecise(card.price)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${card.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                                                    {card.is_active ? 'نشط' : 'مخفي'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap justify-start gap-2">
                                                    <Link href={route('card.edit', card.id)}><Button variant="outline" size="sm" className="rounded-xl">تعديل</Button></Link>
                                                    <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleDelete(card.id)}>حذف</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {cards.links && cards.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
                            {cards.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`rounded-xl px-3 py-1.5 text-sm font-bold ${link.active ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}

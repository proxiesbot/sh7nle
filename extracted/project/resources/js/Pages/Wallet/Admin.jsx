import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumberPrecise } from '@/lib/formatters';

function money(value) {
    return `$${formatNumberPrecise(value)}`;
}

function directionLabel(direction) {
    return direction === 'credit' ? 'إضافة' : 'خصم';
}

function typeLabel(type) {
    const labels = {
        deposit: 'إيداع',
        purchase: 'شراء منتج',
        gift_card_redeem: 'استرداد Gift Card',
        gift_card_purchase: 'شراء Gift Card',
        wheel: 'جائزة عجلة',
        transfer_in: 'تحويل وارد',
        transfer_out: 'تحويل صادر',
        admin_adjustment: 'تعديل أدمن',
        manual: 'يدوي',
    };

    return labels[type] || type || '—';
}

export default function Admin({ transactions, filters = {}, stats = {}, types = [] }) {
    const [form, setForm] = useState({
        search: filters.search || '',
        direction: filters.direction || '',
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('wallet.admin.index'), form, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        setForm({ search: '', direction: '', type: '', date_from: '', date_to: '' });
        router.get(route('wallet.admin.index'));
    };

    return (
        <AdminLayout title="محفظة الموقع والحركات المالية">
            <Head title="محفظة الموقع" />

            <div className="space-y-5 text-right">
                <section className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">إجمالي الإضافات</div>
                        <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">{money(stats.credits)}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">إجمالي الخصم</div>
                        <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">{money(stats.debits)}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">الصافي</div>
                        <div className={`mt-2 text-2xl font-black ${Number(stats.net || 0) >= 0 ? 'text-sky-600 dark:text-sky-300' : 'text-rose-600 dark:text-rose-300'}`}>{money(stats.net)}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">عدد الحركات</div>
                        <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stats.count || 0}</div>
                    </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">بحث وفلترة</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">ابحث باسم المستخدم أو الإيميل أو الوصف، أو فلتر حسب نوع الحركة والتاريخ.</p>

                    <form onSubmit={applyFilters} className="mt-4 grid gap-3 lg:grid-cols-6">
                        <input
                            value={form.search}
                            onChange={(e) => setForm((current) => ({ ...current, search: e.target.value }))}
                            placeholder="اسم / إيميل / وصف"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:col-span-2"
                        />
                        <select
                            value={form.direction}
                            onChange={(e) => setForm((current) => ({ ...current, direction: e.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">كل الحركات</option>
                            <option value="credit">إضافة</option>
                            <option value="debit">خصم</option>
                        </select>
                        <select
                            value={form.type}
                            onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">كل الأنواع</option>
                            {types.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
                        </select>
                        <input
                            type="date"
                            value={form.date_from}
                            onChange={(e) => setForm((current) => ({ ...current, date_from: e.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <input
                            type="date"
                            value={form.date_to}
                            onChange={(e) => setForm((current) => ({ ...current, date_to: e.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <div className="flex gap-2 lg:col-span-6">
                            <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-500">تطبيق الفلتر</button>
                            <button type="button" onClick={resetFilters} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">إعادة ضبط</button>
                        </div>
                    </form>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-950 dark:text-white">سجل الحركات المالية</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">كل إضافة أو خصم رصيد يتم تسجيله هنا.</p>
                        </div>
                    </div>

                    <div className="sh7nle-mobile-scroll">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                <tr>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">المستخدم</th>
                                    <th className="px-4 py-3">النوع</th>
                                    <th className="px-4 py-3">الحركة</th>
                                    <th className="px-4 py-3">المبلغ</th>
                                    <th className="px-4 py-3">قبل</th>
                                    <th className="px-4 py-3">بعد</th>
                                    <th className="px-4 py-3">الوصف</th>
                                    <th className="px-4 py-3">الأدمن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-100 text-slate-800 dark:border-slate-800 dark:text-slate-100">
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-black">{tx.user?.name || '—'}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{tx.user?.email || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3">{typeLabel(tx.type)}</td>
                                        <td className={`px-4 py-3 font-black ${tx.direction === 'credit' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{directionLabel(tx.direction)}</td>
                                        <td className="px-4 py-3 font-black">{money(tx.amount)}</td>
                                        <td className="px-4 py-3">{money(tx.balance_before)}</td>
                                        <td className="px-4 py-3">{money(tx.balance_after)}</td>
                                        <td className="px-4 py-3 max-w-[320px] whitespace-normal leading-6">{tx.description || '—'}</td>
                                        <td className="px-4 py-3">{tx.admin?.name || '—'}</td>
                                    </tr>
                                ))}
                                {!transactions.data.length && (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-10 text-center text-slate-500 dark:text-slate-300">لا توجد حركات مطابقة للفلتر الحالي.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {transactions.links?.length > 3 && (
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                            {transactions.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`rounded-xl px-3 py-2 text-sm font-bold ${link.active ? 'bg-sky-600 text-white' : link.url ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600'}`}
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

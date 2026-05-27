import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { BadgeCheck, ChevronDown, ChevronUp, Clock3, ImageIcon, Receipt, Wallet, XCircle } from 'lucide-react';

const statusMap = {
    0: { label: 'قيد المراجعة', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
    1: { label: 'مقبول', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
    2: { label: 'مرفوض', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

function formatDate(date) {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return date;
    }
}

export default function Deposits({ deposits = [] }) {
    const [expandedId, setExpandedId] = useState(null);
    const list = deposits?.data || deposits || [];

    const toggleExpanded = (id) => {
        setExpandedId((current) => (current === id ? null : id));
    };

    return (
        <PublicLayout>
            <Head title="إيداعاتي" />

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-8 text-right dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href={route('deposit.create')} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 text-sm font-bold text-white">
                        <Wallet className="h-4 w-4" /> إيداع جديد
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">إيداعاتي</h1>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">اضغط على السهم لعرض تفاصيل الوسيلة والمرفقات.</p>
                    </div>
                </div>
            </section>

            <div className="sh7nle-accordion-list mt-5 space-y-3">
                {list.map((deposit) => {
                    const status = statusMap[deposit.status] || statusMap[0];
                    const StatusIcon = status.icon;
                    const isOpen = expandedId === deposit.id;
                    const supportId = deposit.support_id || `DEP-${deposit.id}`;

                    return (
                        <article key={deposit.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={() => toggleExpanded(deposit.id)}
                                className="flex w-full items-center gap-3 px-4 py-4 text-right sm:px-5"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${status.className}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {status.label}
                                        </span>
                                        <h2 className="truncate text-lg font-black text-slate-950 dark:text-white sm:text-xl">{deposit.payment_method?.name || 'وسيلة دفع'}</h2>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{formatDate(deposit.created_at)}</span>
                                        <span>•</span>
                                        <span dir="ltr" className="font-mono">{supportId}</span>
                                        <span>•</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-300">${Number(deposit.amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </button>

                            <div className={`smooth-reveal ${isOpen ? 'is-open' : ''}`}>
                                <div className="smooth-reveal-inner">
                                    <div className="border-t border-slate-100 px-4 pb-4 pt-3 text-right dark:border-slate-800 sm:px-5">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">المبلغ</div><div className="mt-1 font-bold text-slate-950 dark:text-white">${Number(deposit.amount || 0).toFixed(2)}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">رقم العملية</div><div className="mt-1 font-bold text-slate-950 dark:text-white break-all">{deposit.paymentId || '—'}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">الوسيلة</div><div className="mt-1 font-bold text-slate-950 dark:text-white">{deposit.payment_method?.provider || 'manual'}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">ملاحظات</div><div className="mt-1 font-bold text-slate-950 dark:text-white break-all">{deposit.notes || '—'}</div></div>
                                    </div>

                                    <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                        <div className="mb-3 flex items-center justify-end gap-2 text-sm font-bold text-slate-900 dark:text-white"><Receipt className="h-4 w-4 text-sky-600" /> تفاصيل الوسيلة</div>
                                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><div className="mb-1 text-xs text-slate-500 dark:text-slate-400">الوصف / الحساب</div><div>{deposit.payment_method?.account || '—'}</div></div>
                                            {deposit.payment_method?.notes && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><div className="mb-1 text-xs text-slate-500 dark:text-slate-400">تعليمات</div><div>{deposit.payment_method.notes}</div></div>}
                                            {deposit.image && <a href={deposit.image} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sky-700 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-900 dark:text-sky-200"><ImageIcon className="h-4 w-4" /> عرض المرفق</a>}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}

                {list.length === 0 && <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">لا توجد عمليات إيداع حتى الآن.</div>}
            </div>

            {deposits?.links && deposits.links.length > 3 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {deposits.links.map((link, index) => (
                        <Link key={index} href={link.url || '#'} className={`rounded-2xl px-4 py-2 text-sm ${link.active ? 'bg-sky-500 text-white' : 'bg-white text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </PublicLayout>
    );
}

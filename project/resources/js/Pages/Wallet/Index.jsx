import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatNumberPrecise } from '@/lib/formatters';

const typeLabels = {
    deposit: 'إيداع',
    purchase: 'شراء',
    gift_card_purchase: 'شراء Gift Card',
    gift_card_redeem: 'استرداد Gift Card',
    transfer_out: 'تحويل صادر',
    transfer_in: 'تحويل وارد',
    admin_adjustment: 'تعديل إداري',
    wheel: 'عجلة الفرصة',
    refund: 'استرداد',
};

export default function Index({ transactions }) {
    const { auth } = usePage().props;
    const data = transactions?.data || [];
    const links = transactions?.links || [];
    const hasPagination = links.length > 3;

    return (
        <PublicLayout>
            <Head title="المحفظة" />

            {/* Header with balance */}
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href={route('deposit.create')} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-sky-400">
                        <ArrowDownCircle className="h-4 w-4" /> شحن الرصيد
                    </Link>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">المحفظة</h1>
                        </div>
                        <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            ${formatNumberPrecise(auth?.user?.balance || 0)}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">رصيدك الحالي</p>
                    </div>
                </div>
            </section>

            {/* Transactions table */}
            <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="mb-4 text-lg font-black text-slate-950 dark:text-white">حركات الرصيد</h2>

                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
                        <Wallet className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <p className="text-lg font-bold text-slate-500 dark:text-slate-400">لا توجد حركات رصيد بعد</p>
                        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">عند إيداع أو شراء منتج، ستظهر كل الحركات هنا.</p>
                        <Link href={route('deposit.create')} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            ابدأ بشحن رصيدك
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="sh7nle-mobile-scroll">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <th className="rounded-tr-2xl px-4 py-3 text-right">التاريخ</th>
                                        <th className="px-4 py-3 text-right">النوع</th>
                                        <th className="px-4 py-3 text-right">الحركة</th>
                                        <th className="px-4 py-3 text-right">المبلغ</th>
                                        <th className="px-4 py-3 text-right">قبل</th>
                                        <th className="px-4 py-3 text-right">بعد</th>
                                        <th className="rounded-tl-2xl px-4 py-3 text-right">الوصف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((tx) => (
                                        <tr key={tx.id} className="border-b border-slate-100 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30">
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(tx.created_at).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}
                                                <br />
                                                <span className="text-[10px]">{new Date(tx.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block rounded-xl bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {typeLabels[tx.type] || tx.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-black ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {tx.direction === 'credit' ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                                                    {tx.direction === 'credit' ? 'إضافة' : 'خصم'}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 font-bold ${tx.direction === 'credit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                                {tx.direction === 'credit' ? '+' : '-'}${formatNumberPrecise(tx.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${formatNumberPrecise(tx.balance_before)}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${formatNumberPrecise(tx.balance_after)}</td>
                                            <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-600 dark:text-slate-300" title={tx.description || ''}>
                                                {tx.description || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {hasPagination && (
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                {links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                                            link.active
                                                ? 'bg-sky-500 text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                        } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </PublicLayout>
    );
}

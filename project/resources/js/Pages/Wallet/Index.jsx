import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatNumberPrecise } from '@/lib/formatters';

export default function Index({ transactions }) {
    return (
        <PublicLayout>
            <Head title="المحفظة" />
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-xl font-black sm:text-2xl text-slate-950 dark:text-white">المحفظة وحركات الرصيد</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">كل عملية إضافة أو خصم تظهر هنا مع تفاصيلها.</p>
                <div className="mt-6 sh7nle-mobile-scroll">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            <tr>
                                <th className="px-4 py-3">التاريخ</th>
                                <th className="px-4 py-3">النوع</th>
                                <th className="px-4 py-3">الحركة</th>
                                <th className="px-4 py-3">المبلغ</th>
                                <th className="px-4 py-3">قبل</th>
                                <th className="px-4 py-3">بعد</th>
                                <th className="px-4 py-3">الوصف</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.data.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="px-4 py-3">{new Date(tx.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3">{tx.type}</td>
                                    <td className={`px-4 py-3 font-bold ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.direction === 'credit' ? 'إضافة' : 'خصم'}</td>
                                    <td className="px-4 py-3">${formatNumberPrecise(tx.amount)}</td>
                                    <td className="px-4 py-3">${formatNumberPrecise(tx.balance_before)}</td>
                                    <td className="px-4 py-3">${formatNumberPrecise(tx.balance_after)}</td>
                                    <td className="px-4 py-3">{tx.description || '—'}</td>
                                </tr>
                            ))}
                            {!transactions.data.length && <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">لا توجد حركات رصيد بعد.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </PublicLayout>
    );
}

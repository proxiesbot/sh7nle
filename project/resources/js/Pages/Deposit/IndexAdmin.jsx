import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

const statusLabel = (status) => ({ 0: 'قيد المراجعة', 1: 'مقبول', 2: 'مرفوض' }[status] || 'غير معروف');

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

export default function Index({ deposits }) {
    const updateStatus = (depositId, status) => {
        if (confirm(`هل تريد ${status === 1 ? 'قبول' : 'رفض'} هذا الطلب؟`)) {
            router.post(route('deposits.updateStatus', depositId), { status }, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="طلبات إيداع الرصيد">
            <Head title="الإيداعات" />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-right shadow-sm">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="text-xl font-black text-slate-950">طلبات الشحن</h2>
                    <p className="mt-1 text-sm text-slate-500">يمكنك اعتماد أو رفض طلبات الإيداع من هذه الصفحة.</p>
                </div>
                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1100px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">رقم الدعم</th>
                                <th className="px-6 py-4">المستخدم</th>
                                <th className="px-6 py-4">الطريقة</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">المرجع</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.data.map((deposit) => (
                                <tr key={deposit.id} className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50/70">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{deposit.support_id || `DEP-${deposit.id}`}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{deposit.user?.name || '—'}</div>
                                        <div className="text-xs text-slate-500">{deposit.user?.email || ''}</div>
                                    </td>
                                    <td className="px-6 py-4">{deposit.payment_method?.name || '—'}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{money(deposit.amount)}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{deposit.paymentId || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${deposit.status === 1 ? 'bg-emerald-100 text-emerald-700' : deposit.status === 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {statusLabel(deposit.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {deposit.status === 0 ? (
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" onClick={() => updateStatus(deposit.id, 1)} className="bg-emerald-600 text-white hover:bg-emerald-700">قبول</Button>
                                                <Button type="button" variant="outline" onClick={() => updateStatus(deposit.id, 2)} className="border-rose-300 text-rose-700 hover:bg-rose-50">رفض</Button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400">تمت المعالجة</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-center border-t border-slate-200 p-4">
                    {deposits.links && <div className="flex gap-1">{deposits.links.map((link, i) => <Link key={i} href={link.url || '#'} className={`rounded-md px-3 py-1 text-sm ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} ${!link.url && 'pointer-events-none opacity-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
                </div>
            </div>
        </AdminLayout>
    );
}

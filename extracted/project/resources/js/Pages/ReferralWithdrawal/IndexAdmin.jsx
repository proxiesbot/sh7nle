import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

function money(value) { return `$${Number(value || 0).toFixed(2)}`; }
const statusLabel = (status) => ({0:'مراجعة',1:'مقبول',2:'مرفوض',3:'مدفوع'}[status] || '—');

export default function IndexAdmin({ withdrawals }) {
    const { post } = useForm();
    const updateStatus = (id, status) => post(route('referralWithdrawals.updateStatus', id), { data: { status }, preserveScroll: true });

    return (
        <AdminLayout title="طلبات أرباح الإحالة">
            <Head title="طلبات أرباح الإحالة" />
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="text-xl font-black text-slate-950">طلبات سحب أرباح الإحالة</h2>
                    <p className="mt-1 text-sm text-slate-500">يمكنك مراجعة الطلبات وقبولها أو رفضها أو تعليمها كمدفوعة.</p>
                </div>
                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1100px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4">رقم الدعم</th><th className="px-6 py-4">المستخدم</th><th className="px-6 py-4">المبلغ</th><th className="px-6 py-4">الطريقة</th><th className="px-6 py-4">التفاصيل</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4 text-left">إجراءات</th></tr></thead>
                        <tbody>
                            {withdrawals.data.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 last:border-b-0 align-top">
                                    <td className="px-6 py-4 font-bold text-slate-900">{item.support_id}</td>
                                    <td className="px-6 py-4"><div className="font-semibold text-slate-900">{item.user?.name}</div><div className="text-xs text-slate-500">{item.user?.email}</div></td>
                                    <td className="px-6 py-4">{money(item.amount)}</td>
                                    <td className="px-6 py-4">{item.payment_method?.name || '—'}</td>
                                    <td className="px-6 py-4 text-slate-600"><div>{item.account_details}</div>{item.notes && <div className="mt-1 text-xs text-slate-500">{item.notes}</div>}</td>
                                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === 2 ? 'bg-rose-100 text-rose-700' : item.status === 3 ? 'bg-emerald-100 text-emerald-700' : item.status === 1 ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel(item.status)}</span></td>
                                    <td className="px-6 py-4"><div className="flex flex-wrap justify-end gap-2">{item.status === 0 && <><Button size="sm" onClick={() => updateStatus(item.id, 1)}>قبول</Button><Button variant="destructive" size="sm" onClick={() => updateStatus(item.id, 2)}>رفض</Button></>}{item.status === 1 && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(item.id, 3)}>تعليم كمدفوع</Button>}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

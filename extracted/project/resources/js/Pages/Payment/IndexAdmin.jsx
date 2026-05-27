import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

const statusLabel = (status) => ({ 0: 'قيد الانتظار', 1: 'مكتمل', 2: 'مرفوض / مسترجع' }[status] || 'غير معروف');

export default function Index({ payments }) {
    return (
        <AdminLayout title="طلبات الشحن والشراء">
            <Head title="الطلبات" />

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="text-xl font-black text-slate-950">كل الطلبات</h2>
                    <p className="mt-1 text-sm text-slate-500">تتبّع كل عملية من خلال رقم الدعم، المستخدم، المنتج، والتكلفة والربح. الطلبات اليدوية القادمة من المتجر تظهر هنا بحالة قيد الانتظار ليتم تنفيذها من الإدارة.</p>
                </div>
                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1200px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">رقم الدعم</th>
                                <th className="px-6 py-4">المستخدم</th>
                                <th className="px-6 py-4">المنتج</th>
                                <th className="px-6 py-4">الكمية</th>
                                <th className="px-6 py-4">السعر</th>
                                <th className="px-6 py-4">التكلفة</th>
                                <th className="px-6 py-4">الربح</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.data.map((payment) => (
                                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{payment.support_id || `ORD-${payment.id}`}</td>
                                    <td className="px-6 py-4"><div className="font-bold text-slate-900">{payment.user?.name || 'غير معروف'}</div><div className="text-xs text-slate-500">{payment.user?.email || ''}</div></td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{payment.card?.name || 'غير معروف'}</td>
                                    <td className="px-6 py-4">{payment.amount}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{money(payment.price)}</td>
                                    <td className="px-6 py-4">{money(payment.cost_price)}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">{money(payment.profit_amount)}</td>
                                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${payment.status === 1 ? 'bg-emerald-100 text-emerald-700' : payment.status === 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel(payment.status)}</span></td>
                                    <td className="px-6 py-4">{new Date(payment.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-center">
                    {payments.links && <div className="flex gap-1">{payments.links.map((link, i) => <Link key={i} href={link.url || '#'} className={`px-3 py-1 rounded-md text-sm ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} ${!link.url && 'opacity-50 pointer-events-none'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
                </div>
            </div>
        </AdminLayout>
    );
}

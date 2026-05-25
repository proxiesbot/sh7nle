import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminIndex({ tickets }) {
    return (
        <AdminLayout title="الدعم">
            <Head title="الدعم" />
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-right shadow-sm">
                <div className="border-b border-slate-200 p-6">
                    <h1 className="text-xl font-black text-slate-950">رسائل الدعم</h1>
                    <p className="mt-1 text-sm text-slate-500">تابع رسائل الزبائن ورد عليها من هنا.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {tickets.data.map((ticket) => (
                        <Link key={ticket.id} href={route('support.admin.show', ticket.id)} className="block p-5 hover:bg-slate-50">
                            <div className="flex items-center justify-between gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === 'closed' ? 'bg-slate-200 text-slate-700' : ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ticket.status}</span>
                                <div>
                                    <div className="font-black text-slate-950">{ticket.subject}</div>
                                    <div className="mt-1 text-xs text-slate-500">{ticket.user?.name} • {ticket.user?.email} • {ticket.messages_count} رسالة</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

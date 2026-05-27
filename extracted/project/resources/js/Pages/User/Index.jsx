import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

export default function Index({ users }) {
    const { delete: destroy } = useForm();

    return (
        <AdminLayout title="المستخدمون">
            <Head title="المستخدمون" />

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="border-b border-slate-200 p-6">
                    <h2 className="text-xl font-black text-slate-950">لوحة الزبائن والتجار</h2>
                    <p className="mt-2 text-sm text-slate-500">يعرض إجمالي ما شحنه كل مستخدم، ما استهلكه داخل المتجر، ربحك الصافي منه، حالة الحساب، وبيانات الإحالة والتاجر.</p>
                </div>

                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1500px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">الدور</th>
                                <th className="px-6 py-4">الرصيد</th>
                                <th className="px-6 py-4">إجمالي الشحن</th>
                                <th className="px-6 py-4">إجمالي الاستهلاك</th>
                                <th className="px-6 py-4">نسبة الاستهلاك</th>
                                <th className="px-6 py-4">ربحك منه</th>
                                <th className="px-6 py-4">نسبة الربح</th>
                                <th className="px-6 py-4">المستوى</th><th className="px-6 py-4">ربح التاجر</th><th className="px-6 py-4">خصم خاص</th>
                                <th className="px-6 py-4">أرباح الإحالة</th>
                                <th className="px-6 py-4">عدد المحالين</th>
                                <th className="px-6 py-4">لفات العجلة</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => {
                                const primaryRole = user.roles?.[0]?.name || 'Normal';
                                return (
                                    <tr key={user.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{primaryRole}</span></td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{money(user.balance)}</td>
                                        <td className="px-6 py-4">{money(user.total_deposited)}</td>
                                        <td className="px-6 py-4">{money(user.total_spent)}</td>
                                        <td className="px-6 py-4">{Number(user.consumption_rate || 0).toFixed(2)}%</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">{money(user.total_profit)}</td>
                                        <td className="px-6 py-4">{Number(user.profit_rate || 0).toFixed(2)}%</td>
                                        <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${Number(user.customer_level) === 4 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>L{user.customer_level || 1}</span></td><td className="px-6 py-4">{Number(user.reseller_markup_percentage || 0).toFixed(2)}%</td><td className="px-6 py-4">{Number(user.special_price_discount_percentage || 0).toFixed(2)}%</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-violet-700">{money(user.total_referral_earnings)}</div>
                                            <div className="text-xs text-slate-500">رصيد حالي {money(user.referral_balance)}</div>
                                        </td>
                                        <td className="px-6 py-4">{user.referrals_count || 0}</td>
                                        <td className="px-6 py-4"><div className="flex flex-col items-end gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.is_blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.is_blocked ? 'محظور' : 'نشط'}</span>{user.api_enabled && <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">API</span>}</div></td>
                                        <td className="px-6 py-4"><div className="flex justify-end gap-2"><Link href={route('user.edit', user.id)}><Button variant="outline" size="sm">إدارة</Button></Link><Button variant="destructive" size="sm" onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) { destroy(route('user.destroy', user.id)); } }}>حذف</Button></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-center">
                    {users.links && (
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'} className={`px-3 py-1 rounded-md text-sm ${link.active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} ${!link.url && 'opacity-50 pointer-events-none'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

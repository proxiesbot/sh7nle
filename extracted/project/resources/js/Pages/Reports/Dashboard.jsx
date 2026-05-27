import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

const statusLabel = (status) => ({ 0: 'معلّق', 1: 'مكتمل', 2: 'فشل / مسترجع' }[status] || 'غير معروف');

export default function Dashboard({ summary, cards, topCustomers, topReferrers, paymentMethodBreakdown, recentPayments, recentDeposits, recentBanners }) {
    const summaryCards = [
        { label: 'إجمالي المبيعات', value: money(summary.sales) },
        { label: 'إجمالي التكلفة', value: money(summary.cost) },
        { label: 'إجمالي الربح', value: money(summary.profit) },
        { label: 'صافي الربح بعد الإحالة', value: money(summary.netProfit) },
        { label: 'إجمالي الإيداعات', value: money(summary.deposits) },
        { label: 'نسبة الهامش', value: `${Number(summary.averageMargin || 0).toFixed(2)}%` },
        { label: 'عدد المستخدمين', value: summary.users },
        { label: 'التجار', value: summary.sellers },
        { label: 'طلبات معلقة', value: summary.pendingOrders },
        { label: 'إيداعات معلقة', value: summary.pendingDeposits },
        { label: 'إيداعات يدوية', value: summary.manualDeposits },
        { label: 'إيداعات أوتوماتيكية', value: summary.automaticDeposits },
    ];

    return (
        <AdminLayout title="الجرد والتقارير">
            <Head title="الجرد والتقارير" />

            <div className="space-y-6 text-right">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-950">ملخص الجرد والربح</h2>
                            <p className="mt-2 text-sm text-slate-500">من هنا تتابع الإيرادات، التكلفة، الربح، الإيداعات، أداء المنتجات والزبائن، وإشارات النشاط العامة داخل المتجر.</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Link href={route('payment.index')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">الطلبات</Link>
                            <Link href={route('deposit.index')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">الإيداعات</Link>
                            <Link href={route('user.index')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">المستخدمون</Link>
                            <Link href={route('referralWithdrawals.index')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">إحالات</Link>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((item) => (
                            <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                <div className="text-sm text-slate-500">{item.label}</div>
                                <div className="mt-2 text-2xl font-black text-slate-950">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">أفضل المنتجات من حيث الربح</div>
                            <h3 className="text-xl font-black text-slate-950">جرد المنتجات</h3>
                        </div>
                        <div className="sh7nle-mobile-scroll">
                            <table className="min-w-full text-right text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="px-3 py-3">المنتج</th>
                                        <th className="px-3 py-3">مباع</th>
                                        <th className="px-3 py-3">الإيراد</th>
                                        <th className="px-3 py-3">التكلفة</th>
                                        <th className="px-3 py-3">الربح</th>
                                        <th className="px-3 py-3">تعديل السعر</th>
                                        <th className="px-3 py-3">نسبة الربح</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cards.map((card) => (
                                        <tr key={card.id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="px-3 py-3 font-semibold text-slate-900">{card.name}</td>
                                            <td className="px-3 py-3 text-slate-600">{card.sold_units}</td>
                                            <td className="px-3 py-3 text-slate-600">{money(card.revenue)}</td>
                                            <td className="px-3 py-3 text-slate-600">{money(card.total_cost)}</td>
                                            <td className="px-3 py-3 font-bold text-emerald-600">{money(card.total_profit)}</td>
                                            <td className="px-3 py-3 text-slate-600">{Number(card.price_adjustment_percentage || 0).toFixed(2)}%</td>
                                            <td className="px-3 py-3 text-slate-600">{Number(card.profit_percentage || 0).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">الإنفاق + ربحك من كل زبون</div>
                            <h3 className="text-xl font-black text-slate-950">أفضل الزبائن</h3>
                        </div>
                        <div className="space-y-3">
                            {topCustomers.map((customer) => (
                                <div key={customer.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-slate-500">{customer.email}</div>
                                        <div className="font-bold text-slate-900">{customer.name}</div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-slate-500">إجمالي الشراء</div>
                                            <div className="font-bold text-slate-900">{money(customer.spent)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-slate-500">ربحك منه</div>
                                            <div className="font-bold text-emerald-600">{money(customer.profit)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-slate-500">إجمالي الشحن</div>
                                            <div className="font-bold text-slate-900">{money(customer.deposited)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-slate-500">خصمه الخاص</div>
                                            <div className="font-bold text-slate-900">{Number(customer.special_price_discount_percentage || 0).toFixed(2)}%</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">أفضل رموز الإحالة الحالية</div>
                            <h3 className="text-xl font-black text-slate-950">أفضل المحيلين</h3>
                        </div>
                        <div className="space-y-3">
                            {topReferrers.map((user) => (
                                <div key={user.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-slate-500">{user.email}</div>
                                        <div className="font-bold text-slate-900">{user.name}</div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">رمز الإحالة</div><div className="font-mono font-bold text-slate-900">{user.referral_code || '—'}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">المحالون</div><div className="font-bold text-slate-900">{user.referrals_count}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">أرباح الإحالة</div><div className="font-bold text-violet-700">{money(user.total_referral_earnings)}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">نسبته</div><div className="font-bold text-slate-900">{Number(user.referral_rate_percentage || 0).toFixed(2)}%</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-slate-500">جرد طلبات الشحن حسب الطريقة</div>
                            <h3 className="text-xl font-black text-slate-950">طرق الدفع</h3>
                        </div>
                        <div className="space-y-3">
                            {paymentMethodBreakdown.map((method) => (
                                <div key={method.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-slate-500">{method.provider}</div>
                                        <div className="font-bold text-slate-900">{method.name}</div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">عدد الطلبات</div><div className="font-bold text-slate-900">{method.deposits_count}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">المقبول</div><div className="font-bold text-emerald-600">{money(method.approved_amount)}</div></div>
                                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2"><div className="text-slate-500">المعلّق</div><div className="font-bold text-slate-900">{method.pending_count}</div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <h3 className="mb-4 text-xl font-black text-slate-950">أحدث الطلبات والإيداعات</h3>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3">
                                {recentPayments.map((payment) => (
                                    <div key={payment.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm text-slate-500">{payment.card?.name || '—'}</div>
                                            <div className="font-bold text-slate-900">{payment.support_id || payment.orderId}</div>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">{payment.user?.name || '—'} • {money(payment.price)} • {statusLabel(payment.status)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                {recentDeposits.map((deposit) => (
                                    <div key={deposit.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm text-slate-500">{deposit.payment_method?.name || '—'}</div>
                                            <div className="font-bold text-slate-900">{deposit.support_id || deposit.paymentId}</div>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">{deposit.user?.name || '—'} • {money(deposit.amount)} • {deposit.status === 1 ? 'مقبول' : deposit.status === 2 ? 'مرفوض' : 'معلّق'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-xl font-black text-slate-950">أحدث البانرات</h3>
                        <div className="space-y-3">
                            {recentBanners.map((banner) => (
                                <div key={banner.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className={`rounded-full px-3 py-1 text-xs font-bold ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{banner.is_active ? 'نشط' : 'موقوف'}</div>
                                        <div className="font-bold text-slate-900">{banner.title}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">ترتيب العرض: {banner.sort_order}</div>
                                </div>
                            ))}
                            {recentBanners.length === 0 && <div className="text-sm text-slate-500">لا يوجد بانرات حتى الآن.</div>}
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

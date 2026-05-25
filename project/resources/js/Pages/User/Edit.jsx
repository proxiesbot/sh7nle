import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

export default function Edit({ user, roles }) {
    const currentRole = user.roles?.[0]?.name || 'Normal';
    const { data, setData, post, processing, errors } = useForm({
        balance: user.balance ?? 0,
        role: currentRole,
        isBlocked: user.is_blocked ? 1 : 0,
        specialPriceDiscountPercentage: user.special_price_discount_percentage ?? 0,
        resellerMarkupPercentage: user.reseller_markup_percentage ?? 0,
        apiEnabled: user.api_enabled ? 1 : 0,
        regenerateApiToken: 0,
        referralRatePercentage: user.referral_rate_percentage ?? 3,
        wheelSpinsToAdd: 0,
        wheelSpinsToRemove: 0,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('user.update', user.id));
    };

    return (
        <AdminLayout title={`إدارة المستخدم: ${user.name}`}>
            <Head title="إدارة المستخدم" />

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6 text-right">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="balance">الرصيد الحالي</Label>
                                <Input id="balance" type="number" step="0.01" value={data.balance} onChange={(e) => setData('balance', e.target.value)} className="mt-2" />
                                {errors.balance && <div className="mt-1 text-sm text-rose-600">{errors.balance}</div>}
                            </div>
                            <div>
                                <Label htmlFor="role">الدور</Label>
                                <select id="role" value={data.role} onChange={(e) => setData('role', e.target.value)} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="specialPriceDiscountPercentage">خصم خاص لهذا المستخدم (%)</Label>
                                <Input id="specialPriceDiscountPercentage" type="number" step="0.01" min="0" max="100" value={data.specialPriceDiscountPercentage} onChange={(e) => setData('specialPriceDiscountPercentage', e.target.value)} className="mt-2" />
                                <div className="mt-1 text-xs text-slate-500">خصم اختياري بعد تطبيق السعر النهائي.</div>
                            </div>
                            <div>
                                <Label htmlFor="resellerMarkupPercentage">نسبة ربح التاجر من التكلفة (%)</Label>
                                <Input id="resellerMarkupPercentage" type="number" step="0.01" min="0" max="1000" value={data.resellerMarkupPercentage} onChange={(e) => setData('resellerMarkupPercentage', e.target.value)} className="mt-2" />
                                <div className="mt-1 text-xs text-slate-500">عند تفعيلها يصبح سعر هذا التاجر = التكلفة + هذه النسبة.</div>
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="apiEnabled">تفعيل API لهذا العميل</Label>
                                <select id="apiEnabled" value={data.apiEnabled} onChange={(e) => setData('apiEnabled', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                    <option value={0}>غير مفعل</option>
                                    <option value={1}>مفعل - مستوى 4</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="regenerateApiToken">إعادة توليد التوكن عند الحفظ</Label>
                                <select id="regenerateApiToken" value={data.regenerateApiToken} onChange={(e) => setData('regenerateApiToken', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                    <option value={0}>لا</option>
                                    <option value={1}>نعم</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="referralRatePercentage">نسبة أرباح الإحالة (%)</Label>
                            <Input id="referralRatePercentage" type="number" step="0.01" min="0" max="100" value={data.referralRatePercentage} onChange={(e) => setData('referralRatePercentage', e.target.value)} className="mt-2" />
                            <div className="mt-1 text-xs text-slate-500">الخيار موجود بالكود لكن الواجهة العامة مخفية حاليًا حتى تفعله من إعدادات المتجر.</div>
                        </div>

                        <div>
                            <Label htmlFor="isBlocked">حالة الحساب</Label>
                            <select id="isBlocked" value={data.isBlocked} onChange={(e) => setData('isBlocked', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value={0}>نشط</option>
                                <option value={1}>محظور</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <Link href={route('user.index')}><Button type="button" variant="outline">رجوع</Button></Link>
                            <Button type="submit" disabled={processing}>{processing ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6 text-right">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-lg font-black text-slate-950">بيانات الحساب</div>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">الاسم</div><div className="font-bold text-slate-900">{user.name}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">البريد</div><div className="font-bold text-slate-900">{user.email}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">رمز الإحالة</div><div className="font-mono font-bold text-slate-900">{user.referral_code || 'سيتم توليده عند أول حفظ'}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">مستوى العميل</div><div className="font-bold text-slate-900">{user.customer_level || user.stats?.customerLevel || 1}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">API Token</div><div className="font-mono font-bold text-slate-900 break-all">{user.api_token || 'سيتم إنشاؤه عند التفعيل'}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">المُحيل</div><div className="font-bold text-slate-900">{user.referrer ? `${user.referrer.name} (${user.referrer.email})` : 'لا يوجد'}</div></div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-lg font-black text-slate-950">إحصاءات المستخدم</div>
                        <div className="mt-4 grid gap-3 text-sm">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">إجمالي الشحن</div><div className="font-bold text-slate-900">{money(user.stats?.totalDeposited)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">إجمالي الاستهلاك</div><div className="font-bold text-slate-900">{money(user.stats?.consumedBalance)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">نسبة استهلاك الرصيد</div><div className="font-bold text-slate-900">{Number(user.stats?.consumptionRate || 0).toFixed(2)}%</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">عدد الطلبات الناجحة</div><div className="font-bold text-slate-900">{user.stats?.successfulOrders || 0}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">ربحك من هذا المستخدم</div><div className="font-bold text-emerald-600">{money(user.stats?.profitFromUser)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">نسبة ربحك منه</div><div className="font-bold text-slate-900">{Number(user.stats?.profitRate || 0).toFixed(2)}%</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">رصيد الإحالة</div><div className="font-bold text-violet-700">{money(user.stats?.referralBalance)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">إجمالي أرباح الإحالة</div><div className="font-bold text-violet-700">{money(user.stats?.totalReferralEarnings)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">عدد المحالين</div><div className="font-bold text-slate-900">{user.stats?.referralsCount || 0}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

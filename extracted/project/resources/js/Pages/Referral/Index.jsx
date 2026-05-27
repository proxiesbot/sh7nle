import { Head, useForm, usePage } from '@inertiajs/react';
import { Clipboard, DollarSign, Link2, Share2, Users, Wallet } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReferralIndex({ stats = {}, referralLink = '', referralWithdrawals = [], referralWithdrawalMethods = [] }) {
    const { auth } = usePage().props;
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}${referralLink}` : referralLink;

    const withdrawalForm = useForm({
        paymentMethodId: referralWithdrawalMethods[0]?.id || '',
        amount: '',
        accountDetails: '',
        notes: '',
    });

    const submitWithdrawal = (event) => {
        event.preventDefault();
        withdrawalForm.post(route('referralWithdrawals.store'), {
            onSuccess: () => withdrawalForm.reset('amount', 'accountDetails', 'notes'),
        });
    };

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
        } catch (_) {
            // المتصفح قد يمنع النسخ بدون صلاحية. الرابط ظاهر للمستخدم ويمكن نسخه يدويًا.
        }
    };

    return (
        <PublicLayout>
            <Head title="الإحالة" />

            <section className="overflow-hidden rounded-[34px] border border-violet-200 bg-white text-right shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-violet-900/40 dark:bg-slate-900">
                <div className="relative p-5 sm:p-6 lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_25%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_25%)]" />
                    <div className="relative z-10">
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-2 md:order-1">
                                <button
                                    type="button"
                                    onClick={copyInviteLink}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                                >
                                    <Clipboard className="h-4 w-4" />
                                    نسخ رابط الدعوة
                                </button>
                            </div>
                            <div className="md:order-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                                    <Share2 className="h-4 w-4" />
                                    برنامج الإحالة
                                </div>
                                <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">تفاصيل الإحالة</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    شارك رابط الدعوة وتابع رصيد الإحالة وطلبات السحب من مكان واحد.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/50">
                                <div className="mb-3 flex justify-end text-violet-600 dark:text-violet-300"><DollarSign className="h-6 w-6" /></div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">رصيد الإحالة المتاح</div>
                                <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">${Number(stats?.referralBalance || 0).toFixed(2)}</div>
                            </div>
                            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/50">
                                <div className="mb-3 flex justify-end text-sky-600 dark:text-sky-300"><Users className="h-6 w-6" /></div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">عدد الإحالات</div>
                                <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{stats?.referralsCount || 0}</div>
                            </div>
                            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/50">
                                <div className="mb-3 flex justify-end text-emerald-600 dark:text-emerald-300"><Wallet className="h-6 w-6" /></div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">إجمالي أرباح الإحالة</div>
                                <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">${Number(stats?.totalReferralEarnings || 0).toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/55">
                                <div className="mb-3 flex items-center justify-end gap-2 text-sm font-black text-slate-900 dark:text-white">
                                    <Link2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                                    رابط الدعوة الخاص بك
                                </div>
                                <div className="break-all rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left font-mono text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                    {inviteUrl}
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">كود الإحالة</div>
                                        <div className="mt-1 font-mono text-lg font-black text-slate-950 dark:text-white">{auth.user?.referral_code || '—'}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">آخر طلبات السحب</div>
                                        <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{referralWithdrawals.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/55">
                                <div className="mb-4 flex items-center justify-end gap-2 text-sm font-black text-slate-900 dark:text-white">
                                    <Share2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                                    طلب سحب أرباح الإحالة
                                </div>
                                <form onSubmit={submitWithdrawal} className="space-y-4">
                                    <div>
                                        <Label htmlFor="paymentMethodId" className="mb-2 block">طريقة السحب</Label>
                                        <select
                                            id="paymentMethodId"
                                            value={withdrawalForm.data.paymentMethodId}
                                            onChange={(e) => withdrawalForm.setData('paymentMethodId', e.target.value)}
                                            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="">اختر طريقة</option>
                                            {referralWithdrawalMethods.map((method) => (
                                                <option key={method.id} value={method.id}>{method.name}</option>
                                            ))}
                                        </select>
                                        {withdrawalForm.errors.paymentMethodId && <div className="mt-1 text-sm text-rose-600">{withdrawalForm.errors.paymentMethodId}</div>}
                                    </div>
                                    <div>
                                        <Label htmlFor="amount" className="mb-2 block">المبلغ</Label>
                                        <Input id="amount" type="number" step="0.01" value={withdrawalForm.data.amount} onChange={(e) => withdrawalForm.setData('amount', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900" />
                                        {withdrawalForm.errors.amount && <div className="mt-1 text-sm text-rose-600">{withdrawalForm.errors.amount}</div>}
                                    </div>
                                    <div>
                                        <Label htmlFor="accountDetails" className="mb-2 block">تفاصيل الاستلام</Label>
                                        <Input id="accountDetails" value={withdrawalForm.data.accountDetails} onChange={(e) => withdrawalForm.setData('accountDetails', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900" placeholder="رقم المحفظة أو تفاصيل الحساب" />
                                    </div>
                                    <div>
                                        <Label htmlFor="notes" className="mb-2 block">ملاحظات</Label>
                                        <Input id="notes" value={withdrawalForm.data.notes} onChange={(e) => withdrawalForm.setData('notes', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900" placeholder="اختياري" />
                                    </div>
                                    <Button type="submit" disabled={withdrawalForm.processing} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 text-white hover:from-violet-500 hover:to-sky-400">إنشاء طلب سحب</Button>
                                </form>
                            </div>
                        </div>

                        {referralWithdrawals.length > 0 && (
                            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/55">
                                <div className="mb-4 text-sm font-black text-slate-900 dark:text-white">آخر طلبات سحب الإحالة</div>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                    {referralWithdrawals.map((withdrawal) => (
                                        <div key={withdrawal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-black text-slate-900 dark:text-white">${Number(withdrawal.amount || 0).toFixed(2)}</span>
                                                <span className="text-slate-500 dark:text-slate-400">{withdrawal.payment_method?.name || '—'}</span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{withdrawal.status || withdrawal.status_label || 'قيد المراجعة'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

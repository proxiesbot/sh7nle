import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Bell, Clipboard, CreditCard, DollarSign, Gift, Link2, Share2, Users, Wallet, UserRoundCog, KeyRound, Shield, Star } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';
import EditableText from '@/components/EditableText';

export default function Dashboard({ stats, referralLink, referralWithdrawals = [], referralWithdrawalMethods = [], profile = {}, loginActivities = [] }) {
    const { auth, siteSettings = {} } = usePage().props;
    const { t } = useSitePreferences();
    const referralsEnabled = false; // الإحالة أصبحت صفحة مستقلة بالكامل ولا تظهر داخل حسابي.
    const roleNames = [auth.user?.role?.name, ...(auth.user?.roles || []).map((role) => role.name)].filter(Boolean);
    const canTransfer = roleNames.includes('Seller') || roleNames.includes('admin') || roleNames.includes('Super-Admin');

    const withdrawalForm = useForm({
        paymentMethodId: referralWithdrawalMethods[0]?.id || '',
        amount: '',
        accountDetails: '',
        notes: '',
    });

    const profileForm = useForm({
        name: profile.name || auth.user?.name || '',
        email: profile.email || auth.user?.email || '',
        whatsappNumber: profile.whatsapp_number || auth.user?.whatsapp_number || '',
        accountVerificationNotes: profile.account_verification_notes || '',
    });

    const passwordForm = useForm({
        currentPassword: '',
        password: '',
        password_confirmation: '',
    });

    const submitWithdrawal = (event) => {
        event.preventDefault();
        withdrawalForm.post(route('referralWithdrawals.store'), {
            onSuccess: () => withdrawalForm.reset('amount', 'accountDetails', 'notes'),
        });
    };

    const submitProfile = (event) => {
        event.preventDefault();
        profileForm.post(route('account.profile.update'));
    };

    const submitPassword = (event) => {
        event.preventDefault();
        passwordForm.post(route('account.password.update'), {
            onSuccess: () => passwordForm.reset('currentPassword', 'password', 'password_confirmation'),
        });
    };

    const toggleTwoFactor = () => {
        if (profile.two_factor_enabled) {
            router.delete('/user/two-factor-authentication');
            return;
        }

        router.post('/user/two-factor-authentication');
    };

    const quickActions = [
        { href: route('sections.main'), label: t.store, icon: Gift },
        { href: route('deposit.create'), label: t.deposit, icon: Wallet },
        { href: route('user.payments', auth.user.id), label: t.orders, icon: CreditCard },
        { href: route('user.notifications', auth.user.id), label: t.notifications, icon: Bell },
    ];

    const statCards = [
        { label: 'إجمالي الإيداع', value: `$${Number(stats?.totalDeposited || 0).toFixed(2)}` },
        { label: 'إجمالي المشتريات', value: `$${Number(stats?.totalSpent || 0).toFixed(2)}` },
        { label: 'الطلبات الناجحة', value: stats?.successfulOrders || 0 },
        { label: 'الطلبات المعلقة', value: stats?.pendingOrders || 0 },
    ];

    return (
        <PublicLayout>
            <Head title={t.account} />

            <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                            {t.accountSettings}
                        </div>
                        <h1 className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">مرحبًا {auth.user.name}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600 dark:text-slate-300">
                            من هنا تتابع الرصيد، الطلبات، مستوى الحساب، وتعدّل بياناتك من مكان واحد.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {quickActions.map(({ href, label, icon: Icon }) => (
                                <Link key={label} href={href} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 text-right transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                                    <div className="mb-3 flex justify-end text-sky-600"><Icon className="h-5 w-5" /></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{label}</div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">انتقال سريع</div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 text-right shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                        <div className="text-sm text-slate-500 dark:text-slate-400">{t.balance}</div>
                        <div className="mt-2 text-4xl font-black text-slate-950 dark:text-white">${Number(auth.user.balance || 0).toFixed(2)}</div>
                        <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                                <span className="font-semibold text-slate-950 dark:text-white">{auth.user.email}</span>
                                <span>{t.email}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                                <span className="font-semibold text-slate-950 dark:text-white">المستوى {profile.customer_level || 1}</span>
                                <span>مستوى العميل</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                                <span className="font-semibold text-slate-950 dark:text-white">${Number(stats?.consumedBalance || 0).toFixed(2)}</span>
                                <span>الرصيد المستهلك</span>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Link href={route('deposit.create')} className="flex-1">
                                <Button className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 font-bold text-white hover:from-sky-400 hover:to-violet-400">{t.addBalance}</Button>
                            </Link>
                            {canTransfer && (
                                <Link href={route('user.transferMoneyPage')} className="flex-1">
                                    <Button variant="outline" className="w-full rounded-2xl border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white">تحويل رصيد</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-5 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <Link href={route('user.payments', auth.user.id)} className="text-sm text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">عرض الطلبات</Link>
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">ملخص الاستخدام</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((item) => (
                        <div key={item.label} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                            <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
                            <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</div>
                        </div>
                    ))}
                </div>

                {profile.api_enabled && (
                    <div className="mt-6 rounded-[26px] border border-sky-200 bg-sky-50 p-5 dark:border-sky-900/50 dark:bg-sky-950/20">
                        <div className="flex items-center justify-between gap-4">
                            <Link href={route('account.api')} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">فتح وثائق API</Link>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2 text-lg font-black text-slate-950 dark:text-white">
                                    <Star className="h-4 w-4 text-sky-600" />
                                    <span>مستوى API مفعل</span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300">يمكنك ربط موقع خارجي عبر التوكن الخاص بك.</div>
                            </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-white bg-white px-4 py-3 text-left font-mono text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {profile.api_token_preview || '—'}
                        </div>
                    </div>
                )}
            </section>

            {referralsEnabled && (
                <section id="referrals" className="mt-8 overflow-hidden rounded-[34px] border border-violet-200 bg-white text-right shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-violet-900/40 dark:bg-slate-900">
                    <div className="relative p-5 sm:p-6 lg:p-7">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_25%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_25%)]" />
                        <div className="relative z-10">
                            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-wrap items-center gap-2 md:order-1">
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}${referralLink}`)}
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
                                    <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">تفاصيل الإحالة</h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                        شارك رابطك، وتابع أرباحك وطلبات السحب من مكان واحد.
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
                                        {window.location.origin}{referralLink}
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
            )}

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-end gap-2 text-slate-900 dark:text-white">
                        <UserRoundCog className="h-4 w-4 text-sky-600" />
                        <span className="font-semibold">{t.editProfile}</span>
                    </div>
                    <form onSubmit={submitProfile} className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="mb-2 block">{t.name}</Label>
                            <Input id="name" value={profileForm.data.name} onChange={(e) => profileForm.setData('name', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                            {profileForm.errors.name && <div className="mt-1 text-sm text-rose-600">{profileForm.errors.name}</div>}
                        </div>
                        <div>
                            <Label htmlFor="email" className="mb-2 block">{t.email}</Label>
                            <Input id="email" type="email" value={profileForm.data.email} onChange={(e) => profileForm.setData('email', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                            {profileForm.errors.email && <div className="mt-1 text-sm text-rose-600">{profileForm.errors.email}</div>}
                        </div>
                        <div>
                            <Label htmlFor="whatsappNumber" className="mb-2 block">{t.whatsapp}</Label>
                            <Input id="whatsappNumber" value={profileForm.data.whatsappNumber} onChange={(e) => profileForm.setData('whatsappNumber', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                            {profileForm.errors.whatsappNumber && <div className="mt-1 text-sm text-rose-600">{profileForm.errors.whatsappNumber}</div>}
                        </div>
                        <div>
                            <Label htmlFor="accountVerificationNotes" className="mb-2 block">طلب توثيق الحساب</Label>
                            <textarea id="accountVerificationNotes" value={profileForm.data.accountVerificationNotes} onChange={(e) => profileForm.setData('accountVerificationNotes', e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="اكتب ملاحظات التوثيق أو نوع الحساب المطلوب توثيقه" />
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">الحالة الحالية: {profile.account_verification_status || 'not_requested'}</div>
                        </div>
                        <Button type="submit" disabled={profileForm.processing} className="w-full rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">{t.save}</Button>
                    </form>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white p-5 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-end gap-2 text-slate-900 dark:text-white">
                        <KeyRound className="h-4 w-4 text-violet-600" />
                        <span className="font-semibold">{t.changePassword}</span>
                    </div>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <div>
                            <Label htmlFor="currentPassword" className="mb-2 block">{t.currentPassword}</Label>
                            <Input id="currentPassword" type="password" value={passwordForm.data.currentPassword} onChange={(e) => passwordForm.setData('currentPassword', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                            {passwordForm.errors.currentPassword && <div className="mt-1 text-sm text-rose-600">{passwordForm.errors.currentPassword}</div>}
                        </div>
                        <div>
                            <Label htmlFor="password" className="mb-2 block">{t.newPassword}</Label>
                            <Input id="password" type="password" value={passwordForm.data.password} onChange={(e) => passwordForm.setData('password', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                            {passwordForm.errors.password && <div className="mt-1 text-sm text-rose-600">{passwordForm.errors.password}</div>}
                        </div>
                        <div>
                            <Label htmlFor="password_confirmation" className="mb-2 block">{t.confirmPassword}</Label>
                            <Input id="password_confirmation" type="password" value={passwordForm.data.password_confirmation} onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                            <Button type="button" variant="outline" onClick={toggleTwoFactor} className="rounded-2xl border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                                {profile.two_factor_enabled ? t.disable2fa : t.enable2fa}
                            </Button>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <Shield className="h-4 w-4 text-emerald-600" />
                                {t.auth2fa}
                            </div>
                        </div>
                        <Button type="submit" disabled={passwordForm.processing} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 text-white">{t.changePassword}</Button>
                    </form>
                </div>
            </section>

            <section className="mt-8 rounded-[30px] border border-slate-200 bg-white p-5 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-end gap-2 text-slate-900 dark:text-white">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">سجل أمان الحساب</span>
                </div>
                <p className="mb-4 text-sm leading-7 text-slate-500 dark:text-slate-400">هنا تظهر عمليات تسجيل الدخول وتغيير كلمة المرور والجهاز والمتصفح المستخدم.</p>
                <div className="grid gap-3 md:grid-cols-2">
                    {loginActivities.length ? loginActivities.map((activity) => (
                        <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${activity.is_new_device ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>{activity.is_new_device ? 'جهاز جديد' : 'معروف'}</span>
                                <span className="font-black text-slate-950 dark:text-white">{activity.event === 'password_changed' ? 'تغيير كلمة المرور' : 'تسجيل دخول'}</span>
                            </div>
                            <div className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                                {activity.device_type || 'Unknown'} • {activity.browser || 'Unknown'} • {activity.platform || 'Unknown'}<br />
                                IP: {activity.ip_address || '—'}<br />
                                {new Date(activity.created_at).toLocaleString()}
                            </div>
                        </div>
                    )) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">لا يوجد سجل أمان بعد.</div>}
                </div>
            </section>

        </PublicLayout>
    );
}

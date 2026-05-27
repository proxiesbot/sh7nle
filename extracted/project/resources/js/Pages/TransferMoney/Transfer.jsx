import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Mail, SendHorizonal, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Transfer() {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        amount: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/user/transferMoney');
    };

    return (
        <PublicLayout>
            <Head title="تحويل الرصيد" />

            <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                            <SendHorizonal className="h-4 w-4" /> تحويل الرصيد بين الحسابات
                        </div>
                        <h1 className="text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">إرسال رصيد إلى حساب آخر</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300">
                            أدخل البريد الإلكتروني للحساب المستلم، ثم حدّد قيمة التحويل. سيتم خصم الرصيد من حسابك وإضافته مباشرة إلى الحساب الآخر بعد التأكيد.
                        </p>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 text-right dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                        <div className="mb-3 flex justify-end text-sky-600"><Wallet className="h-5 w-5" /></div>
                        <div className="text-xl font-black text-slate-950 dark:text-white">رصيدك الحالي</div>
                        <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(auth.user?.balance ?? 0).toFixed(2)}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            تأكد من البريد الإلكتروني للمستلم وقيمة التحويل قبل الإرسال.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                            <ArrowLeft className="h-4 w-4" /> العودة
                        </Link>
                        <div className="text-right">
                            <div className="text-lg font-black text-slate-950 dark:text-white">بيانات التحويل</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">أدخل بريد المستلم والمبلغ المطلوب تحويله</div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                بريد المستلم
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="pr-10"
                                    placeholder="friend@example.com"
                                />
                            </div>
                            {errors.email && <div className="mt-1 text-sm text-rose-600">{errors.email}</div>}
                        </div>

                        <div>
                            <Label htmlFor="amount" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                المبلغ
                            </Label>
                            <div className="relative">
                                <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="pr-10"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.amount && <div className="mt-1 text-sm text-rose-600">{errors.amount}</div>}
                        </div>

                        <Button type="submit" disabled={processing} className="w-full rounded-2xl bg-sky-600 hover:bg-sky-700">
                            {processing ? 'جارٍ التحويل...' : 'إرسال الرصيد الآن'}
                        </Button>
                    </form>
                </div>
            </section>
        </PublicLayout>
    );
}

import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, CheckCircle2, ChevronDown, ClipboardCopy, Receipt, ShieldCheck, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PublicLayout from '@/Layouts/PublicLayout';
import EditableText from '@/components/EditableText';

function money(value, digits = 2) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function isApiSyriaProvider(provider) {
    return ['apisyria_syriatel', 'apisyria_shamcash'].includes(provider);
}

export default function Create({ paymentMethods = [], usdRate = 1, minimumDepositUsd = 1 }) {
    const { auth } = usePage().props;
    const [linkMessage, setLinkMessage] = useState('');
    const [linkError, setLinkError] = useState('');
    const [creatingLink, setCreatingLink] = useState(false);
    const [paymentStep, setPaymentStep] = useState('amount');
    const [detailsOpen, setDetailsOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        currency: 'USD',
        paymentMethodId: '',
        paymentId: '',
        paymentImage: null,
        notes: '',
    });

    const selectedMethod = useMemo(
        () => paymentMethods.find((method) => Number(method.id) === Number(data.paymentMethodId)),
        [paymentMethods, data.paymentMethodId],
    );

    const isAutomatic = Boolean(selectedMethod?.is_automatic);
    const isKazawalletAutomatic = Boolean(selectedMethod?.is_automatic && selectedMethod?.provider === 'kazawallet');
    const isApiSyriaAutomatic = Boolean(selectedMethod?.is_automatic && isApiSyriaProvider(selectedMethod?.provider));
    const allowManualFallback = Boolean(selectedMethod?.allow_manual_fallback);
    const requiresPaymentId = Boolean(selectedMethod?.requires_payment_id);
    const requiresImage = Boolean(selectedMethod?.requires_image);
    const localAmount = Number(data.amount || 0) * Number(usdRate || 1);

    const resetFlowForMethod = (methodId) => {
        const alreadySelected = Number(data.paymentMethodId) === Number(methodId);
        setData('paymentMethodId', methodId);
        setData('paymentId', '');
        setData('notes', '');
        setData('paymentImage', null);
        setPaymentStep('amount');
        setLinkError('');
        setLinkMessage('');
        setDetailsOpen(alreadySelected ? !detailsOpen : true);
    };

    const submitDeposit = (event) => {
        event.preventDefault();
        setLinkError('');
        setLinkMessage('');

        setData('currency', 'USD');
        post(route('deposit.store'), {
            preserveScroll: true,
        });
    };

    const createPaymentLink = async (event) => {
        event.preventDefault();
        setLinkError('');
        setLinkMessage('');
        setCreatingLink(true);

        try {
            const response = await window.axios.post(route('deposit.createPaymentLink'), {
                amount: data.amount,
                currency: 'USD',
                paymentMethodId: data.paymentMethodId,
            });

            const url = response.data?.url;
            if (url) {
                window.location.href = url;
                return;
            }

            setLinkMessage(response.data?.message || 'تم إنشاء رابط الدفع.');
        } catch (error) {
            setLinkError(error.response?.data?.message || 'تعذر إنشاء رابط الدفع في الوقت الحالي.');
        } finally {
            setCreatingLink(false);
        }
    };

    const copyAccount = async () => {
        if (!selectedMethod?.account) return;

        try {
            await navigator.clipboard.writeText(selectedMethod.account);
            setLinkMessage('تم نسخ الحساب.');
        } catch {
            setLinkMessage('');
        }
    };

    const canProceedToPaymentDetails = Number(data.amount || 0) >= Number(minimumDepositUsd || 0) && selectedMethod;
    const manualDetailsVisible = selectedMethod && !isApiSyriaAutomatic && (!isAutomatic || allowManualFallback);

    return (
        <PublicLayout>
            <Head title="إيداع الرصيد" />

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_25px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
                <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <BadgeCheck className="h-4 w-4" /> شحن الرصيد
                        </div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-4xl"><EditableText textKey="deposit.create.title" defaultText="إيداع الرصيد بالدولار" context="واجهة الزبون" /></h1>
                        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300">
                            <EditableText textKey="deposit.create.subtitle" defaultText="اختر وسيلة الدفع، ثم افتح التفاصيل لإرسال مبلغ الإيداع وتأكيد العملية." context="واجهة الزبون" />
                        </p>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 text-right dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:p-5">
                        <div className="mb-3 flex justify-end text-emerald-600"><Wallet className="h-5 w-5" /></div>
                        <div className="text-lg font-black text-slate-950 dark:text-white"><EditableText textKey="deposit.create.usd_rate_label" defaultText="تسعيرة الدولار" context="واجهة الزبون" /></div>
                        <div className="mt-2 text-2xl font-black text-emerald-600 sm:text-3xl">{money(usdRate, 2)}</div>
                        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300 sm:text-sm"><EditableText textKey="deposit.create.currency_note" defaultText="العملة المعتمدة للإيداع هي الدولار." context="واجهة الزبون" /></p>
                    </div>
                </div>
            </section>

            <section className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[1fr_310px] lg:gap-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <form onSubmit={submitDeposit} className="space-y-5">
                        <div>
                            <Label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white"><EditableText textKey="deposit.create.method_label" defaultText="وسيلة الدفع" context="واجهة الزبون" /></Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {paymentMethods.map((method) => {
                                    const selected = Number(data.paymentMethodId) === Number(method.id);
                                    return (
                                        <button
                                            type="button"
                                            key={method.id}
                                            onClick={() => resetFlowForMethod(method.id)}
                                            className={`rounded-[20px] border p-3 text-right transition duration-200 ease-out hover:-translate-y-0.5 sm:p-4 ${selected ? 'border-emerald-300 bg-emerald-50 shadow-sm dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                                            aria-expanded={selected && detailsOpen}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${selected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-white text-sky-700 dark:bg-slate-900 dark:text-sky-300'}`}>
                                                    {method.image ? <img src={method.image} alt={method.name} className="h-full w-full object-contain p-1" /> : (method.is_automatic ? <Zap className="h-4 w-4" /> : <Receipt className="h-4 w-4" />)}
                                                </div>
                                                <div className="min-w-0 flex-1 text-right">
                                                    <div className="truncate font-black text-slate-900 dark:text-white">{method.name}</div>
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{method.is_automatic ? 'دفع أوتوماتيكي' : 'دفع يدوي'} · اضغط لعرض التفاصيل</div>
                                                </div>
                                                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${selected && detailsOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.paymentMethodId && <div className="mt-2 text-sm text-rose-600">{errors.paymentMethodId}</div>}
                        </div>

                        <div
                            className={`${detailsOpen && selectedMethod ? 'instant-reveal rounded-[24px] border border-slate-200 bg-slate-50/70 opacity-100 dark:border-slate-700 dark:bg-slate-800/40' : 'hidden'}`}
                        >
                            <div className="space-y-5 p-4 sm:p-5">
                                {selectedMethod && (
                                    <>
                                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                                            <button type="button" onClick={() => setDetailsOpen(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                                إخفاء
                                            </button>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">تفاصيل الإيداع عبر</div>
                                                <div className="font-black text-slate-950 dark:text-white">{selectedMethod.name}</div>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="amount" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white"><EditableText textKey="deposit.create.amount_label" defaultText="المبلغ بالدولار" context="واجهة الزبون" /></Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    min={minimumDepositUsd}
                                                    step="0.01"
                                                    value={data.amount}
                                                    onChange={(event) => {
                                                        setData('amount', event.target.value);
                                                        setPaymentStep('amount');
                                                    }}
                                                    className="h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                    placeholder={`الحد الأدنى ${minimumDepositUsd}$`}
                                                />
                                                {errors.amount && <div className="mt-2 text-sm text-rose-600">{errors.amount}</div>}
                                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">الحد الأدنى للإيداع: ${minimumDepositUsd}</div>
                                            </div>

                                            <div>
                                                <Label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white"><EditableText textKey="deposit.create.currency_label" defaultText="العملة" context="واجهة الزبون" /></Label>
                                                <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                                                    <span className="text-xs text-slate-500"><EditableText textKey="deposit.create.fixed_currency" defaultText="ثابتة" context="واجهة الزبون" /></span>
                                                    <span className="font-black">USD</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isApiSyriaAutomatic && paymentStep === 'amount' && (
                                            <Button
                                                type="button"
                                                disabled={!canProceedToPaymentDetails}
                                                onClick={() => setPaymentStep('details')}
                                                className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-emerald-400 hover:to-violet-400 disabled:opacity-60"
                                            >
                                                الدفع الآن
                                            </Button>
                                        )}

                                        {isApiSyriaAutomatic && paymentStep === 'details' && (
                                            <div className="space-y-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                                <div className="flex items-center justify-end gap-2 text-base font-black text-emerald-800 dark:text-emerald-200">
                                                    <ShieldCheck className="h-5 w-5" /> <EditableText textKey="deposit.create.payment_details" defaultText="تفاصيل الدفع" context="واجهة الزبون" />
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                                                        <div className="text-xs text-slate-500"><EditableText textKey="deposit.create.amount_label" defaultText="المبلغ بالدولار" context="واجهة الزبون" /></div>
                                                        <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">${money(data.amount)}</div>
                                                    </div>
                                                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                                                        <div className="text-xs text-slate-500"><EditableText textKey="deposit.create.required_amount" defaultText="المبلغ المطلوب إرساله" context="واجهة الزبون" /></div>
                                                        <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{money(localAmount, 2)}</div>
                                                    </div>
                                                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                                                        <div className="text-xs text-slate-500"><EditableText textKey="deposit.create.method_label" defaultText="وسيلة الدفع" context="واجهة الزبون" /></div>
                                                        <div className="mt-1 font-black text-slate-950 dark:text-white">{selectedMethod?.name}</div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                                    <div className="mb-1 text-xs font-semibold text-slate-500"><EditableText textKey="deposit.create.send_to_account" defaultText="أرسل المبلغ إلى الحساب التالي" context="واجهة الزبون" /></div>
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <button type="button" onClick={copyAccount} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                                                            <ClipboardCopy className="h-4 w-4" /> نسخ
                                                        </button>
                                                        <div className="break-all text-base font-black text-slate-950 dark:text-white">{selectedMethod?.account || 'لم يتم ضبط الحساب'}</div>
                                                    </div>
                                                    {selectedMethod?.notes && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-7 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedMethod.notes}</div>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="paymentId" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white"><EditableText textKey="deposit.create.transaction_label" defaultText="رقم العملية بعد الدفع" context="واجهة الزبون" /></Label>
                                                    <Input
                                                        id="paymentId"
                                                        type="text"
                                                        value={data.paymentId}
                                                        onChange={(event) => setData('paymentId', event.target.value)}
                                                        className="h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        placeholder="أدخل رقم العملية للتحقق التلقائي"
                                                    />
                                                    {errors.paymentId && <div className="mt-2 text-sm text-rose-600">{errors.paymentId}</div>}
                                                </div>

                                                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                                                    <Button type="button" variant="outline" onClick={() => setPaymentStep('amount')} className="h-12 rounded-2xl">
                                                        تعديل المبلغ
                                                    </Button>
                                                    <Button type="submit" disabled={processing} className="h-12 rounded-2xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">
                                                        {processing ? 'جارٍ التحقق...' : 'تأكيد الدفع'}
                                                    </Button>
                                                </div>

                                                <div className="flex items-start justify-end gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                                    <AlertCircle className="mt-1 h-4 w-4" />
                                                    إذا لم يتم التحقق فورًا، سيتم إنشاء طلب إيداع قيد المعالجة للمراجعة.
                                                </div>
                                            </div>
                                        )}

                                        {isKazawalletAutomatic && (
                                            <Button type="button" onClick={createPaymentLink} disabled={creatingLink} className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-violet-400">الدفع الآن</Button>
                                        )}

                                        {manualDetailsVisible && requiresPaymentId && (
                                            <div>
                                                <Label htmlFor="paymentIdManual" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">رقم العملية</Label>
                                                <Input id="paymentIdManual" type="text" value={data.paymentId} onChange={(event) => setData('paymentId', event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="TXN-123456" />
                                                {errors.paymentId && <div className="mt-2 text-sm text-rose-600">{errors.paymentId}</div>}
                                            </div>
                                        )}

                                        {manualDetailsVisible && requiresImage && (
                                            <div>
                                                <Label htmlFor="paymentImage" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">صورة الإشعار</Label>
                                                <input id="paymentImage" type="file" accept="image/*" onChange={(event) => setData('paymentImage', event.target.files?.[0] || null)} className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:ml-3 file:rounded-xl file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:font-bold file:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:file:bg-slate-800 dark:file:text-sky-200" />
                                                {errors.paymentImage && <div className="mt-2 text-sm text-rose-600">{errors.paymentImage}</div>}
                                            </div>
                                        )}

                                        {manualDetailsVisible && (
                                            <>
                                                <div>
                                                    <Label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">ملاحظات إضافية</Label>
                                                    <textarea id="notes" rows={3} value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="flex w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="ملاحظة اختيارية" />
                                                </div>
                                                <Button type="submit" disabled={processing} className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-violet-400">
                                                    {processing ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب'}
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {!selectedMethod && (
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                                اختر وسيلة دفع أولًا، وستظهر تفاصيل الإيداع بشكل مختصر وسلس.
                            </div>
                        )}

                        {linkMessage && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{linkMessage}</div>}
                        {linkError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{linkError}</div>}
                    </form>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="flex items-center justify-end gap-2 text-lg font-black text-slate-950 dark:text-white">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> <EditableText textKey="deposit.create.after_confirm_title" defaultText="ماذا يحدث بعد التأكيد؟" context="واجهة الزبون" />
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        <p>• <EditableText textKey="deposit.create.after_confirm_1" defaultText="إذا تم التحقق من العملية سيتم إضافة الرصيد فورًا." context="واجهة الزبون" /></p>
                        <p>• <EditableText textKey="deposit.create.after_confirm_2" defaultText="إذا لم يتم التحقق فورًا، سيظهر الطلب ضمن إيداعاتك بحالة قيد المعالجة." context="واجهة الزبون" /></p>
                        <p>• <EditableText textKey="deposit.create.after_confirm_3" defaultText="إذا احتاج الطلب مراجعة، سيتم التعامل معه من قبل الإدارة." context="واجهة الزبون" /></p>
                        <p>• <EditableText textKey="deposit.create.after_confirm_4" defaultText="لا يمكن استخدام نفس رقم العملية مرتين." context="واجهة الزبون" /></p>
                        <Link href={route('user.deposits', auth.user.id)} className="inline-flex rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                            <EditableText textKey="deposit.create.go_deposits" defaultText="الذهاب إلى إيداعاتي" context="واجهة الزبون" />
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

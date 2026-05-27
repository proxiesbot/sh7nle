import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EditableText from '@/components/EditableText';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        provider: 'manual',
        account: '',
        notes: '',
        image: null,
        status: 1,
        isAutomatic: 0,
        allowManualFallback: 0,
        requiresPaymentId: 1,
        requiresImage: 1,
        availableForReferralWithdrawal: 0,
        binanceMerchantId: '',
        binanceApiKey: '',
        binanceSecretKey: '',
        binanceWebhookSecret: '',
        binanceCurrency: 'USDT',
        binanceReturnUrl: '',
    });

    const providerIsKazawallet = data.provider === 'kazawallet';
    const providerIsBinance = data.provider === 'binance';
    const providerIsManualWallet = ['syriatel_cash','sham_cash','kazawallet_manual','coinex','faucetpay','cryptopayment','bank_transfer'].includes(data.provider);
    const providerIsApiSyria = ['apisyria_syriatel', 'apisyria_shamcash'].includes(data.provider);

    const submit = (e) => {
        e.preventDefault();
        post(route('paymentMethods.store'));
    };

    const updateProvider = (provider) => {
        setData('provider', provider);

        if (provider === 'kazawallet') {
            setData('isAutomatic', 1);
            setData('requiresPaymentId', 0);
            setData('requiresImage', 0);
            return;
        }

        if (provider === 'binance') {
            setData('isAutomatic', 1);
            setData('requiresPaymentId', 0);
            setData('requiresImage', 0);
            setData('allowManualFallback', 1);
            setData('binanceCurrency', data.binanceCurrency || 'USDT');
            return;
        }

        if (['apisyria_syriatel', 'apisyria_shamcash'].includes(provider)) {
            setData('isAutomatic', 1);
            setData('requiresPaymentId', 1);
            setData('requiresImage', 0);
            setData('allowManualFallback', 0);
            return;
        }

        setData('isAutomatic', 0);
        setData('requiresPaymentId', 1);
        setData('requiresImage', 1);
        setData('allowManualFallback', 0);
    };

    return (
        <AdminLayout title="إضافة طريقة دفع">
            <Head title="إضافة طريقة دفع" />

            <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 text-right shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <Label htmlFor="name"><EditableText textKey="payment_methods.form.name_label" defaultText="اسم الطريقة" context="طرق الدفع" /></Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" />
                            {errors.name && <div className="mt-1 text-sm text-red-500">{errors.name}</div>}
                        </div>

                        <div>
                            <Label htmlFor="provider"><EditableText textKey="payment_methods.form.provider_label" defaultText="المزوّد" context="طرق الدفع" /></Label>
                            <select id="provider" value={data.provider} onChange={(e) => updateProvider(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="manual">تحويل يدوي / Manual</option>
                                <option value="syriatel_cash">Syriatel Cash يدوي</option>
                                <option value="sham_cash">ShamCash يدوي</option>
                                <option value="kazawallet_manual">KazaWallet يدوي</option>
                                <option value="bank_transfer">تحويل بنكي / حوالة</option>
                                <option value="binance">Binance Pay / USDT</option>
                                <option value="coinex">CoinEx</option>
                                <option value="faucetpay">FaucetPay</option>
                                <option value="cryptopayment">CryptoPayment</option>
                                <option value="kazawallet">Kazawallet (أوتوماتيكي)</option>
                                <option value="apisyria_syriatel">Syriatel Cash عبر API سوريا (أوتوماتيكي)</option>
                                <option value="apisyria_shamcash">ShamCash عبر API سوريا (أوتوماتيكي)</option>
                            </select>
                            {errors.provider && <div className="mt-1 text-sm text-red-500">{errors.provider}</div>}
                            {providerIsManualWallet && <div className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-xs leading-6 text-sky-700 dark:bg-sky-950/30 dark:text-sky-200">ضع بيانات الحساب أو عنوان المحفظة أو التعليمات داخل حقل الحساب والملاحظات، وسيظهر للمستخدم ضمن صفحة الإيداع.</div>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="account"><EditableText textKey="payment_methods.form.account_label" defaultText="الحساب / المحفظة / الوصف المختصر" context="طرق الدفع" /></Label>
                        <Input id="account" value={data.account} onChange={(e) => setData('account', e.target.value)} className="mt-1" placeholder={data.provider === 'apisyria_syriatel' ? 'أدخل رقم Syriatel Cash أو cash code المرتبط بـ API Syria' : data.provider === 'apisyria_shamcash' ? 'أدخل account_address الخاص بـ ShamCash المرتبط بـ API Syria' : 'مثال: USDT TRC20 أو وصف موجز للطريقة'} />
                    </div>

                    <div>
                        <Label htmlFor="notes"><EditableText textKey="payment_methods.form.notes_label" defaultText="تعليمات إضافية" context="طرق الدفع" /></Label>
                        <textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="mt-1 flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </div>

                    {providerIsBinance && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                            <div className="mb-4 text-right">
                                <h3 className="text-lg font-black text-amber-900 dark:text-amber-100">إعدادات Binance Pay الأوتوماتيكي</h3>
                                <p className="mt-1 text-xs leading-6 text-amber-800 dark:text-amber-200">
                                    كل الحقول المطلوبة لتفعيل دفع Binance موجودة هنا ضمن زر Binance نفسه. اترك القيم فارغة إذا بدك تستخدمه يدويًا مؤقتًا.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="binanceMerchantId">Merchant ID</Label>
                                    <Input id="binanceMerchantId" value={data.binanceMerchantId} onChange={(e) => setData('binanceMerchantId', e.target.value)} className="mt-1" placeholder="Binance merchant id" />
                                </div>
                                <div>
                                    <Label htmlFor="binanceCurrency">العملة</Label>
                                    <Input id="binanceCurrency" value={data.binanceCurrency} onChange={(e) => setData('binanceCurrency', e.target.value.toUpperCase())} className="mt-1" placeholder="USDT" />
                                </div>
                                <div>
                                    <Label htmlFor="binanceApiKey">API Key</Label>
                                    <Input id="binanceApiKey" value={data.binanceApiKey} onChange={(e) => setData('binanceApiKey', e.target.value)} className="mt-1" placeholder="Binance API Key" />
                                </div>
                                <div>
                                    <Label htmlFor="binanceSecretKey">Secret Key</Label>
                                    <Input id="binanceSecretKey" value={data.binanceSecretKey} onChange={(e) => setData('binanceSecretKey', e.target.value)} className="mt-1" placeholder="Binance Secret Key" />
                                </div>
                                <div>
                                    <Label htmlFor="binanceWebhookSecret">Webhook Secret</Label>
                                    <Input id="binanceWebhookSecret" value={data.binanceWebhookSecret} onChange={(e) => setData('binanceWebhookSecret', e.target.value)} className="mt-1" placeholder="Webhook/Signature secret" />
                                </div>
                                <div>
                                    <Label htmlFor="binanceReturnUrl">Return URL</Label>
                                    <Input id="binanceReturnUrl" value={data.binanceReturnUrl} onChange={(e) => setData('binanceReturnUrl', e.target.value)} className="mt-1" placeholder="https://sh7nle.com/deposit/callback" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="image"><EditableText textKey="payment_methods.form.image_label" defaultText="شعار/أيقونة طريقة الدفع" context="طرق الدفع" /></Label>
                        <div className="mt-2 text-xs text-slate-500">ارفع لوغو صغير مثل Binance أو Syriatel ليظهر بجانب اسم الطريقة.</div><Input id="image" type="file" onChange={(e) => setData('image', e.target.files[0])} className="mt-1" accept="image/*" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white"><EditableText textKey="payment_methods.form.status_label" defaultText="الحالة" context="طرق الدفع" /></div>
                            <select value={data.status} onChange={(e) => setData('status', Number(e.target.value))} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value={1}>مفعّلة</option>
                                <option value={0}>معطّلة</option>
                            </select>
                        </label>

                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white">آلية التنفيذ</div>
                            <select value={data.isAutomatic} onChange={(e) => setData('isAutomatic', Number(e.target.value))} disabled={providerIsKazawallet || providerIsApiSyria || providerIsBinance} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
                                <option value={0}>يدوي</option>
                                <option value={1}>أوتوماتيكي</option>
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white">السماح بطلب يدوي احتياطي</div>
                            <select value={data.allowManualFallback} onChange={(e) => setData('allowManualFallback', Number(e.target.value))} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value={0}>لا</option>
                                <option value={1}>نعم</option>
                            </select>
                            <div className="mt-2 text-xs text-gray-500">إذا تعذر الربط الأوتوماتيكي، يمكن للزبون إرسال طلب يدوي للمراجعة.</div>
                        </label>

                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white">متاحة لسحب أرباح الإحالة</div>
                            <select value={data.availableForReferralWithdrawal} onChange={(e) => setData('availableForReferralWithdrawal', Number(e.target.value))} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value={0}>لا</option>
                                <option value={1}>نعم</option>
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white">يتطلب رقم معاملة من الزبون</div>
                            <select value={data.requiresPaymentId} onChange={(e) => setData('requiresPaymentId', Number(e.target.value))} disabled={providerIsKazawallet || providerIsBinance || Number(data.isAutomatic) === 1} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
                                <option value={1}>نعم</option>
                                <option value={0}>لا</option>
                            </select>
                        </label>

                        <label className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-white">يتطلب صورة إشعار</div>
                            <select value={data.requiresImage} onChange={(e) => setData('requiresImage', Number(e.target.value))} disabled={providerIsKazawallet || providerIsBinance || Number(data.isAutomatic) === 1} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
                                <option value={1}>نعم</option>
                                <option value={0}>لا</option>
                            </select>
                        </label>
                    </div>

                    {providerIsKazawallet && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Kazawallet هو مزود أوتوماتيكي. أما الطرق اليدوية فتُضاف بشكل مستقل ويمكنك فلترتها من صفحة طرق الدفع.
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4">
                        <Link href={route('paymentMethods.index')}>
                            <Button variant="outline" type="button"><EditableText textKey="payment_methods.form.cancel_button" defaultText="إلغاء" context="طرق الدفع" /></Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            {processing ? 'جارٍ الحفظ...' : 'حفظ طريقة الدفع'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

import { Head, useForm } from '@inertiajs/react';
import { DatabaseBackup, Facebook, Instagram, Mail, MessageCircle, Send, Settings, ShieldCheck, Store, Wallet } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function Field({ id, label, error, children }) {
    return (
        <div>
            <Label htmlFor={id} className="text-sm font-black text-slate-800 dark:text-slate-100">{label}</Label>
            <div className="mt-2">{children}</div>
            {error && <div className="mt-1 text-sm font-bold text-rose-600 dark:text-rose-300">{error}</div>}
        </div>
    );
}

function SectionCard({ icon: Icon, title, description, children }) {
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-start justify-end gap-3 text-right">
                <div>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
                    {description && <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow-lg shadow-sky-500/20">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {children}
        </section>
    );
}

export default function Index({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        globalMarkupPercentage: settings.globalMarkupPercentage ?? 0,
        depositUsdToSypRate: settings.depositUsdToSypRate ?? 1,
        minimumDepositUsd: settings.minimumDepositUsd ?? 1,
        level2Threshold: settings.level2Threshold ?? 250,
        level3Threshold: settings.level3Threshold ?? 1000,
        level4Threshold: settings.level4Threshold ?? 2500,
        level2DiscountPercentage: settings.level2DiscountPercentage ?? 0,
        level3DiscountPercentage: settings.level3DiscountPercentage ?? 0,
        level4DiscountPercentage: settings.level4DiscountPercentage ?? 0,
        bannerAutoplaySeconds: settings.bannerAutoplaySeconds ?? 5,
        referralsEnabled: settings.referralsEnabled ? 1 : 0,
        socialFacebookUrl: settings.socialFacebookUrl || '',
        socialInstagramUrl: settings.socialInstagramUrl || '',
        socialTelegramUrl: settings.socialTelegramUrl || '',
        socialWhatsappUrl: settings.socialWhatsappUrl || '',
        socialSupportUrl: settings.socialSupportUrl || '',
        mailFromAddress: settings.mailFromAddress || '',
        mailFromName: settings.mailFromName || 'Sh7nle',
        mailHost: settings.mailHost || '',
        mailPort: settings.mailPort || '587',
        mailUsername: settings.mailUsername || '',
        telegramBackupEnabled: settings.telegramBackupEnabled ? 1 : 0,
        telegramBackupBotToken: settings.telegramBackupBotToken || '',
        telegramBackupChatId: settings.telegramBackupChatId || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    const inputClass = 'h-12 rounded-2xl border-slate-200 bg-white text-right text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

    return (
        <AdminLayout title="إعدادات المتجر">
            <Head title="إعدادات المتجر" />

            <form onSubmit={submit} className="space-y-5 text-right">
                <SectionCard icon={Settings} title="إعدادات عامة" description="تحكم بإعدادات العرض والأسعار العامة للمتجر.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field id="globalMarkupPercentage" label="نسبة الربح العامة على الأسعار الحالية (%)" error={errors.globalMarkupPercentage}>
                            <Input id="globalMarkupPercentage" type="number" step="0.01" value={data.globalMarkupPercentage} onChange={(e) => setData('globalMarkupPercentage', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="bannerAutoplaySeconds" label="مدة تبديل البانرات تلقائيًا (ثانية)" error={errors.bannerAutoplaySeconds}>
                            <Input id="bannerAutoplaySeconds" type="number" min="2" max="60" value={data.bannerAutoplaySeconds} onChange={(e) => setData('bannerAutoplaySeconds', e.target.value)} className={inputClass} />
                        </Field>
                    </div>
                </SectionCard>

                <SectionCard icon={Wallet} title="الإيداع والعملة" description="إعدادات التحويل والحد الأدنى للإيداع.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field id="depositUsdToSypRate" label="سعر الدولار مقابل الليرة للإيداع" error={errors.depositUsdToSypRate}>
                            <Input id="depositUsdToSypRate" type="number" min="1" step="0.01" value={data.depositUsdToSypRate} onChange={(e) => setData('depositUsdToSypRate', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="minimumDepositUsd" label="الحد الأدنى للإيداع بالدولار" error={errors.minimumDepositUsd}>
                            <Input id="minimumDepositUsd" type="number" min="0.01" step="0.01" value={data.minimumDepositUsd} onChange={(e) => setData('minimumDepositUsd', e.target.value)} className={inputClass} />
                        </Field>
                    </div>
                </SectionCard>

                <SectionCard icon={ShieldCheck} title="المستويات والخصومات" description="حدد حدود الترقية والخصومات الخاصة بكل مستوى.">
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field id="level2Threshold" label="حد الترقية للمستوى الثاني">
                            <Input id="level2Threshold" type="number" step="0.01" value={data.level2Threshold} onChange={(e) => setData('level2Threshold', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="level3Threshold" label="حد الترقية للمستوى الثالث">
                            <Input id="level3Threshold" type="number" step="0.01" value={data.level3Threshold} onChange={(e) => setData('level3Threshold', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="level4Threshold" label="حد الترقية للمستوى الرابع">
                            <Input id="level4Threshold" type="number" step="0.01" value={data.level4Threshold} onChange={(e) => setData('level4Threshold', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="level2DiscountPercentage" label="خصم المستوى الثاني (%)">
                            <Input id="level2DiscountPercentage" type="number" step="0.01" min="0" max="100" value={data.level2DiscountPercentage} onChange={(e) => setData('level2DiscountPercentage', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="level3DiscountPercentage" label="خصم المستوى الثالث (%)">
                            <Input id="level3DiscountPercentage" type="number" step="0.01" min="0" max="100" value={data.level3DiscountPercentage} onChange={(e) => setData('level3DiscountPercentage', e.target.value)} className={inputClass} />
                        </Field>
                        <Field id="level4DiscountPercentage" label="خصم المستوى الرابع (%)">
                            <Input id="level4DiscountPercentage" type="number" step="0.01" min="0" max="100" value={data.level4DiscountPercentage} onChange={(e) => setData('level4DiscountPercentage', e.target.value)} className={inputClass} />
                        </Field>
                    </div>
                </SectionCard>

                <SectionCard icon={Store} title="الميزات" description="إظهار أو إخفاء ميزات معينة من واجهة المستخدم.">
                    <Field id="referralsEnabled" label="برنامج الإحالة">
                        <select id="referralsEnabled" value={data.referralsEnabled} onChange={(e) => setData('referralsEnabled', Number(e.target.value))} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                            <option value={0}>مخفي حاليًا</option>
                            <option value={1}>مفعل</option>
                        </select>
                    </Field>
                </SectionCard>

                <div id="social-links" className="scroll-mt-24"><SectionCard icon={MessageCircle} title="روابط التواصل" description="أضف روابط التواصل التي تظهر في القائمة وواجهة المستخدم.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field id="socialFacebookUrl" label="رابط فيسبوك" error={errors.socialFacebookUrl}>
                            <div className="relative"><Facebook className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input id="socialFacebookUrl" value={data.socialFacebookUrl} onChange={(e) => setData('socialFacebookUrl', e.target.value)} className={`${inputClass} pl-12`} placeholder="https://facebook.com/..." /></div>
                        </Field>
                        <Field id="socialInstagramUrl" label="رابط إنستغرام" error={errors.socialInstagramUrl}>
                            <div className="relative"><Instagram className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input id="socialInstagramUrl" value={data.socialInstagramUrl} onChange={(e) => setData('socialInstagramUrl', e.target.value)} className={`${inputClass} pl-12`} placeholder="https://instagram.com/..." /></div>
                        </Field>
                        <Field id="socialTelegramUrl" label="رابط تلغرام" error={errors.socialTelegramUrl}>
                            <div className="relative"><Send className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input id="socialTelegramUrl" value={data.socialTelegramUrl} onChange={(e) => setData('socialTelegramUrl', e.target.value)} className={`${inputClass} pl-12`} placeholder="https://t.me/..." /></div>
                        </Field>
                        <Field id="socialWhatsappUrl" label="رابط واتساب" error={errors.socialWhatsappUrl}>
                            <div className="relative"><MessageCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input id="socialWhatsappUrl" value={data.socialWhatsappUrl} onChange={(e) => setData('socialWhatsappUrl', e.target.value)} className={`${inputClass} pl-12`} placeholder="https://wa.me/..." /></div>
                        </Field>
                        <Field id="socialSupportUrl" label="رابط الدعم الخارجي" error={errors.socialSupportUrl}>
                            <Input id="socialSupportUrl" value={data.socialSupportUrl} onChange={(e) => setData('socialSupportUrl', e.target.value)} className={inputClass} placeholder="رابط اختياري للدعم" />
                        </Field>
                    </div>
                    </SectionCard>
                </div>


                <SectionCard icon={Mail} title="إعدادات البريد" description="ضع بيانات بريد البزنس حتى تصل رسائل التحقق وتنبيهات تغيير كلمة المرور. كلمة المرور/SMTP password تبقى في ملف .env حفاظًا على الأمان.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field id="mailFromAddress" label="إيميل الإرسال" error={errors.mailFromAddress}>
                            <Input id="mailFromAddress" type="email" value={data.mailFromAddress} onChange={(e) => setData('mailFromAddress', e.target.value)} className={inputClass} placeholder="support@sh7nle.com" />
                        </Field>
                        <Field id="mailFromName" label="اسم المرسل" error={errors.mailFromName}>
                            <Input id="mailFromName" value={data.mailFromName} onChange={(e) => setData('mailFromName', e.target.value)} className={inputClass} placeholder="Sh7nle" />
                        </Field>
                        <Field id="mailHost" label="SMTP Host" error={errors.mailHost}>
                            <Input id="mailHost" value={data.mailHost} onChange={(e) => setData('mailHost', e.target.value)} className={inputClass} placeholder="smtp.hostinger.com" />
                        </Field>
                        <Field id="mailPort" label="SMTP Port" error={errors.mailPort}>
                            <Input id="mailPort" value={data.mailPort} onChange={(e) => setData('mailPort', e.target.value)} className={inputClass} placeholder="587" />
                        </Field>
                        <Field id="mailUsername" label="SMTP Username" error={errors.mailUsername}>
                            <Input id="mailUsername" value={data.mailUsername} onChange={(e) => setData('mailUsername', e.target.value)} className={inputClass} placeholder="support@sh7nle.com" />
                        </Field>
                    </div>
                    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">ملاحظة: كلمة مرور SMTP لا تُحفظ من الواجهة. ضعها في .env باسم MAIL_PASSWORD.</p>
                </SectionCard>

                <SectionCard icon={DatabaseBackup} title="نسخ قاعدة البيانات إلى تلغرام" description="اضبط بوت تلغرام والقناة ليتم إرسال نسخة قاعدة البيانات يوميًا تلقائيًا.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field id="telegramBackupEnabled" label="تفعيل النسخ اليومي">
                            <select id="telegramBackupEnabled" value={data.telegramBackupEnabled} onChange={(e) => setData('telegramBackupEnabled', Number(e.target.value))} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                <option value={0}>غير مفعل</option>
                                <option value={1}>مفعل</option>
                            </select>
                        </Field>
                        <Field id="telegramBackupChatId" label="Telegram Channel/Chat ID" error={errors.telegramBackupChatId}>
                            <Input id="telegramBackupChatId" value={data.telegramBackupChatId} onChange={(e) => setData('telegramBackupChatId', e.target.value)} className={inputClass} placeholder="-100xxxxxxxxxx" />
                        </Field>
                        <Field id="telegramBackupBotToken" label="Telegram Bot Token" error={errors.telegramBackupBotToken}>
                            <Input id="telegramBackupBotToken" value={data.telegramBackupBotToken} onChange={(e) => setData('telegramBackupBotToken', e.target.value)} className={inputClass} placeholder="123456:ABC..." />
                        </Field>
                    </div>
                </SectionCard>

                <div className="sticky bottom-3 z-10 flex justify-end rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                    <Button type="submit" disabled={processing} className="h-12 min-w-40 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-600 font-black text-white">
                        {processing ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}

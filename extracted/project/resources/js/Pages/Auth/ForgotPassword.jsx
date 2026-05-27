import { Head, Link, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';

export default function ForgotPassword({ status }) {
    const { isArabic } = useSitePreferences();
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.email'));
    };

    const iconSide = isArabic ? 'right-4' : 'left-4';
    const inputPadding = isArabic ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left';

    return (
        <>
            <Head title={isArabic ? 'نسيت كلمة المرور' : 'Forgot password'} />
            <AuthShell
                mode="forgot"
                title={isArabic ? 'استعادة كلمة المرور' : 'Reset password'}
                subtitle={isArabic ? 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة.' : 'Enter your email to receive a reset link.'}
            >
                {status && <div className="mb-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</div>}
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="relative">
                            <Mail className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${inputPadding} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`}
                                autoComplete="username"
                                placeholder="example@email.com"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-rose-300">{errors.email}</p>}
                    </div>
                    <Button type="submit" disabled={processing} className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 text-base font-black text-white shadow-lg shadow-violet-500/20 hover:from-sky-400 hover:to-fuchsia-500">
                        {processing ? (isArabic ? 'جارٍ الإرسال...' : 'Sending...') : (isArabic ? 'إرسال رابط الاستعادة' : 'Send reset link')}
                    </Button>
                </form>
                <p className="mt-7 text-center text-sm text-slate-400">
                    <Link href={route('login')} className="font-black text-sky-300 transition hover:text-sky-200">{isArabic ? 'العودة لتسجيل الدخول' : 'Back to login'}</Link>
                </p>
            </AuthShell>
        </>
    );
}

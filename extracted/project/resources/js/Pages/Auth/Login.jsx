import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';
import AuthShell from '@/components/AuthShell';

export default function Login({ status, canResetPassword = true }) {
    const { isArabic } = useSitePreferences();
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const iconSide = isArabic ? 'right-4' : 'left-4';
    const inputPadding = isArabic ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left';

    return (
        <>
            <Head title={isArabic ? 'تسجيل الدخول' : 'Login'}>
                <meta name="description" content="تسجيل الدخول إلى متجر شحنلي للوصول إلى الطلبات والرصيد والخدمات." />
            </Head>

            <AuthShell
                mode="login"
                title={isArabic ? 'تسجيل الدخول' : 'Login'}
                subtitle={isArabic ? 'أدخل بيانات حسابك للمتابعة.' : 'Enter your account details to continue.'}
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

                    <div>
                        <Label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'كلمة المرور' : 'Password'}</Label>
                        <div className="relative">
                            <LockKeyhole className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white`}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-rose-300">{errors.password}</p>}
                    </div>

                    <div className={`flex flex-wrap items-center gap-3 ${isArabic ? 'justify-between' : 'justify-between'}`}>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="rounded border-cyan-400/30 bg-white/10 text-violet-600 focus:ring-violet-500 focus:ring-offset-0" />
                            <span>{isArabic ? 'تذكرني' : 'Remember me'}</span>
                        </label>
                        {canResetPassword && <Link href={route('password.request')} className="text-sm font-black text-sky-300 transition hover:text-sky-200">{isArabic ? 'هل نسيت كلمة المرور؟' : 'Forgot password?'}</Link>}
                    </div>

                    <Button type="submit" disabled={processing} className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 text-base font-black text-white shadow-lg shadow-violet-500/20 hover:from-sky-400 hover:to-fuchsia-500">
                        {processing ? (isArabic ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (isArabic ? 'تسجيل الدخول' : 'Login')}
                    </Button>
                </form>

                <div className="my-7 flex items-center gap-3 text-slate-500">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-sm">{isArabic ? 'أو' : 'or'}</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <a href={route('auth.google.redirect')} className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white transition hover:bg-white/[0.08]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">G</span>
                    {isArabic ? 'تسجيل الدخول عبر Google' : 'Continue with Google'}
                </a>

                <p className="mt-7 text-center text-sm text-slate-400">
                    {isArabic ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                    <Link href={route('register')} className="font-black text-sky-300 transition hover:text-sky-200">{isArabic ? 'إنشاء حساب' : 'Create account'}</Link>
                </p>
            </AuthShell>
        </>
    );
}

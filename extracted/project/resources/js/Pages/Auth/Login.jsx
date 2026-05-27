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
                title={isArabic ? 'تسجيل الدخول' : 'Login'}
                subtitle={isArabic ? 'أدخل بيانات حسابك للمتابعة.' : 'Enter your account details to continue.'}
            >
                {status && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</div>}

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="relative">
                            <Mail className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                className={`h-13 rounded-2xl border border-slate-200 bg-slate-50 ${inputPadding} text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-400/20`}
                                autoComplete="username"
                                placeholder="example@email.com"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">{isArabic ? 'كلمة المرور' : 'Password'}</Label>
                        <div className="relative">
                            <LockKeyhole className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                className={`h-13 rounded-2xl border border-slate-200 bg-slate-50 ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-400/20`}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700`}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0" />
                            <span>{isArabic ? 'تذكرني' : 'Remember me'}</span>
                        </label>
                        {canResetPassword && <Link href={route('password.request')} className="text-sm font-black text-sky-600 transition hover:text-sky-500">{isArabic ? 'هل نسيت كلمة المرور؟' : 'Forgot password?'}</Link>}
                    </div>

                    <Button type="submit" disabled={processing} className="h-13 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-violet-600 text-base font-black text-white shadow-md hover:from-sky-400 hover:to-violet-500">
                        {processing ? (isArabic ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (isArabic ? 'تسجيل الدخول' : 'Login')}
                    </Button>
                </form>

                <div className="my-6 flex items-center gap-3 text-slate-400">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-sm">{isArabic ? 'أو' : 'or'}</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                <a href={route('auth.google.redirect')} className="flex h-13 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-900">G</span>
                    {isArabic ? 'تسجيل الدخول عبر Google' : 'Continue with Google'}
                </a>

                <p className="mt-6 text-center text-sm text-slate-500">
                    {isArabic ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                    <Link href={route('register')} className="font-black text-sky-600 transition hover:text-sky-500">{isArabic ? 'إنشاء حساب' : 'Create account'}</Link>
                </p>
            </AuthShell>
        </>
    );
}

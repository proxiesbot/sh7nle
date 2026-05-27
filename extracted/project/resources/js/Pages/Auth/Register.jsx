import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, Mail, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSitePreferences } from '@/lib/sitePreferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShell from '@/components/AuthShell';

export default function Register() {
    const { isArabic } = useSitePreferences();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const referralCode = new URLSearchParams(window.location.search).get('ref') || '';
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        referral_code: referralCode,
        terms: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const iconSide = isArabic ? 'right-4' : 'left-4';
    const inputPadding = isArabic ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left';

    return (
        <>
            <Head title={isArabic ? 'إنشاء حساب' : 'Create account'}>
                <meta name="description" content="إنشاء حساب جديد في متجر شحنلي للاستفادة من خدمات الشحن والطلبات." />
            </Head>

            <AuthShell
                mode="register"
                title={isArabic ? 'إنشاء حساب' : 'Create account'}
                subtitle={isArabic ? 'املأ المعلومات المطلوبة لإنشاء حسابك.' : 'Fill in the required information to create your account.'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'الاسم الكامل' : 'Full name'}</Label>
                        <div className="relative">
                            <UserCircle2 className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${inputPadding} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'} required />
                        </div>
                        {errors.name && <p className="mt-2 text-sm text-rose-300">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="relative">
                            <Mail className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${inputPadding} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} placeholder="example@email.com" required />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-rose-300">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'كلمة المرور' : 'Password'}</Label>
                        <div className="relative">
                            <LockKeyhole className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="password" type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} placeholder="••••••••" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white`}>
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-2 text-sm text-rose-300">{errors.password}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'تأكيد كلمة المرور' : 'Confirm password'}</Label>
                        <div className="relative">
                            <LockKeyhole className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} placeholder="••••••••" required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white`}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password_confirmation && <p className="mt-2 text-sm text-rose-300">{errors.password_confirmation}</p>}
                    </div>

                    {referralCode ? (
                        <div>
                            <Label htmlFor="referral_code" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'كود الإحالة' : 'Referral code'}</Label>
                            <Input id="referral_code" value={data.referral_code} onChange={(e) => setData('referral_code', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'text-right' : 'text-left'} text-white`} />
                            {errors.referral_code && <p className="mt-2 text-sm text-rose-300">{errors.referral_code}</p>}
                        </div>
                    ) : null}

                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                        <input type="checkbox" checked={data.terms} onChange={(e) => setData('terms', e.target.checked)} className="mt-0.5 rounded border-cyan-400/30 bg-white/10 text-violet-600 focus:ring-violet-500 focus:ring-offset-0" />
                        <span>{isArabic ? 'أوافق على ' : 'I agree to the '}<Link href={route('legal.terms')} className="font-black text-sky-300">{isArabic ? 'الشروط' : 'Terms'}</Link>{' · '}<Link href={route('legal.privacy')} className="font-black text-sky-300">{isArabic ? 'الخصوصية' : 'Privacy'}</Link>{' · '}<Link href={route('legal.agreement')} className="font-black text-sky-300">{isArabic ? 'اتفاقية المستخدم' : 'User Agreement'}</Link></span>
                    </label>
                    {errors.terms && <p className="text-sm text-rose-300">{errors.terms}</p>}

                    <Button type="submit" disabled={processing} className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 text-base font-black text-white shadow-lg shadow-violet-500/20 hover:from-sky-400 hover:to-fuchsia-500">
                        {processing ? (isArabic ? 'جارٍ إنشاء الحساب...' : 'Creating account...') : (isArabic ? 'إنشاء حساب' : 'Create account')}
                    </Button>
                </form>

                <div className="my-7 flex items-center gap-3 text-slate-500">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-sm">{isArabic ? 'أو' : 'or'}</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <a href={route('auth.google.redirect')} className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white transition hover:bg-white/[0.08]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">G</span>
                    {isArabic ? 'إنشاء حساب عبر Google' : 'Create account with Google'}
                </a>

                <p className="mt-7 text-center text-sm text-slate-400">
                    {isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                    <Link href={route('login')} className="font-black text-sky-300 transition hover:text-sky-200">{isArabic ? 'تسجيل الدخول' : 'Login'}</Link>
                </p>
            </AuthShell>
        </>
    );
}

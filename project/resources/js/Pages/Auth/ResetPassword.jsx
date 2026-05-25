import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSitePreferences } from '@/lib/sitePreferences';

export default function ResetPassword({ email, token }) {
    const { isArabic } = useSitePreferences();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.update'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const iconSide = isArabic ? 'right-4' : 'left-4';
    const inputPadding = isArabic ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left';

    return (
        <>
            <Head title={isArabic ? 'تعيين كلمة مرور جديدة' : 'Set new password'} />
            <AuthShell
                mode="reset"
                title={isArabic ? 'كلمة مرور جديدة' : 'New password'}
                subtitle={isArabic ? 'أدخل كلمة المرور الجديدة.' : 'Enter your new password.'}
            >
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="relative">
                            <Mail className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${inputPadding} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} required />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-rose-300">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-200">{isArabic ? 'كلمة المرور الجديدة' : 'New password'}</Label>
                        <div className="relative">
                            <LockKeyhole className={`pointer-events-none absolute ${iconSide} top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`} />
                            <Input id="password" type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData('password', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} required />
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
                            <Input id="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className={`h-14 rounded-2xl border border-white/10 bg-white/[0.06] ${isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-white shadow-inner shadow-black/20 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20`} required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute ${isArabic ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white`}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" disabled={processing} className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 text-base font-black text-white shadow-lg shadow-violet-500/20 hover:from-sky-400 hover:to-fuchsia-500">
                        {processing ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...') : (isArabic ? 'تعيين كلمة المرور' : 'Set password')}
                    </Button>
                </form>
            </AuthShell>
        </>
    );
}

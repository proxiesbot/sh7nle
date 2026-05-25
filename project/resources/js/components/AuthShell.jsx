import { Link } from '@inertiajs/react';
import { useSitePreferences } from '@/lib/sitePreferences';

export default function AuthShell({ title, subtitle, children }) {
    const { isArabic } = useSitePreferences();

    return (
        <div dir={isArabic ? 'rtl' : 'ltr'} className="auth-light-shell relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-6 text-slate-900 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(139,92,246,0.10),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#ffffff_54%,#eef7ff_100%)]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] [background-size:38px_38px]" />

            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] flex-col justify-center">
                <div className="mb-5 flex items-center justify-between gap-3 smooth-fade-slide-enter">
                    <Link href={route('sections.main')} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <span>{isArabic ? 'العودة للمتجر' : 'Back to store'}</span>
                    </Link>
                </div>

                <section className="smooth-scale-enter overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                    <div className="border-b border-slate-100 px-5 py-7 text-center sm:px-8">
                        <img src="/images/brand/sh7nle-icon-192.png" alt="Sh7nle" className="mx-auto h-20 w-20 rounded-[26px] object-cover shadow-[0_0_35px_rgba(56,189,248,0.22)]" />
                        <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">{title}</h1>
                        {subtitle ? <p className="mt-3 text-sm leading-7 text-slate-500">{subtitle}</p> : null}
                    </div>
                    <div className="px-5 py-6 sm:px-8 sm:py-8">
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}

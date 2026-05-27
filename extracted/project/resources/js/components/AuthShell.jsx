import { Link } from '@inertiajs/react';
import { useSitePreferences } from '@/lib/sitePreferences';

export default function AuthShell({ title, subtitle, children }) {
    const { isArabic } = useSitePreferences();

    return (
        <div dir={isArabic ? 'rtl' : 'ltr'} className="relative min-h-screen bg-gradient-to-b from-[#f0f7ff] via-white to-[#eef5ff] px-4 py-6 text-slate-900 sm:px-6">
            <main className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] flex-col justify-center">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <Link href={route('sections.main')} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <span>{isArabic ? 'العودة للمتجر' : 'Back to store'}</span>
                    </Link>
                </div>

                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-5 py-7 text-center sm:px-8">
                        <img src="/images/brand/sh7nle-icon-192.png" alt="Sh7nle" width="80" height="80" className="mx-auto h-20 w-20 rounded-[26px] object-cover" />
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

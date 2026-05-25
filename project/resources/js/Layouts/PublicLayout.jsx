import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CreditCard,
    Facebook,
    Gift,
    Globe,
    Instagram,
    Languages,
    LifeBuoy,
    LogIn,
    LogOut,
    Menu,
    MessageCircle,
    Moon,
    Receipt,
    Send,
    ShieldCheck,
    Sparkles,
    Store,
    Sun,
    UserCircle2,
    Wallet,
    X,
} from 'lucide-react';
import { useSitePreferences } from '@/lib/sitePreferences';
import LoadingOverlay from '@/components/LoadingOverlay';
import GlobalTextEditor from '@/components/GlobalTextEditor';
import AutoTranslator from '@/components/AutoTranslator';

function safeRoute(name, params = undefined, fallback = '#') {
    try {
        return params === undefined ? route(name) : route(name, params);
    } catch {
        return fallback;
    }
}

function normalizeRole(role) {
    return String(role || '').toLowerCase().replace(/[\s_-]/g, '');
}

export default function PublicLayout({ children }) {
    const brandLogo = '/images/brand/sh7nle-icon-192.png';
    const { auth = {}, flash, appName, socialLinks = {}, siteSettings = {}, isAdmin: sharedIsAdmin = false, isSuperAdmin: sharedIsSuperAdmin = false } = usePage().props;
    const user = auth?.user;
    const { locale, setLocale, isArabic, isDark, setIsDark, t: translations } = useSitePreferences();
    const dictionary = translations && typeof translations === 'object' ? translations : {};
    const t = (key) => dictionary?.[key] ?? key;
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const optionsRef = useRef(null);

    const targetLocale = locale === 'ar' ? 'en' : 'ar';
    const targetLocaleName = targetLocale === 'ar' ? 'العربية' : 'English';

    useEffect(() => {
        function handleClickOutside(event) {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setIsOptionsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOptionsOpen || typeof document === 'undefined') return undefined;

        const scrollY = window.scrollY || window.pageYOffset || 0;
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;
        const originalBodyTop = document.body.style.top;
        const originalBodyWidth = document.body.style.width;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.top = originalBodyTop;
            document.body.style.width = originalBodyWidth;
            window.scrollTo(0, scrollY);
        };
    }, [isOptionsOpen]);

    const safeUrl = (url) => {
        if (!url || url === '#') return '#';
        if (typeof url === 'string' && (url.startsWith('/') || url.startsWith('#'))) return url;

        try {
            const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://sh7nle.local');
            if (!['http:', 'https:'].includes(parsed.protocol)) return '#';
            if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
            return parsed.href;
        } catch {
            return '#';
        }
    };

    const roleNames = useMemo(
        () => [user?.role?.name, user?.role, ...(user?.roles || []).map((role) => role.name), ...(user?.role_names || [])].filter(Boolean),
        [user],
    );

    const normalizedRoles = roleNames.map(normalizeRole);
    const adminEmail = String(user?.email || '').toLowerCase();
    const detectedIsSuperAdmin = normalizedRoles.includes('superadmin') || normalizedRoles.includes('superadministrator');
    const detectedIsAdmin = detectedIsSuperAdmin || normalizedRoles.includes('admin') || normalizedRoles.includes('administrator');
    const isAdmin = Boolean(user && (sharedIsAdmin || sharedIsSuperAdmin || detectedIsAdmin || user?.is_admin || user?.is_super_admin || user?.admin || adminEmail.includes('admin')));
    const isSuperAdmin = Boolean(user && (sharedIsSuperAdmin || detectedIsSuperAdmin || user?.is_super_admin || adminEmail.includes('superadmin')));
    const referralsEnabled = Boolean(siteSettings?.features?.referralsEnabled);

    const closeMenu = () => setIsOptionsOpen(false);

    const menuLinks = user
        ? [
              { href: safeRoute('sections.main'), label: t('store'), icon: Store },
              { href: safeRoute('account'), label: t('profile'), icon: UserCircle2 },
              { href: safeRoute('deposit.create'), label: t('deposit'), icon: Wallet },
              { href: safeRoute('user.deposits', user.id), label: t('transactions'), icon: Receipt },
              { href: safeRoute('user.payments', user.id), label: t('orders'), icon: CreditCard },
              { href: safeRoute('user.notifications', user.id), label: t('notifications'), icon: Bell },
              ...(referralsEnabled ? [{ href: safeRoute('referrals.index'), label: t('referral'), icon: Globe }] : []),
              ...(user?.api_enabled ? [{ href: safeRoute('account.api'), label: 'API', icon: Globe }] : []),
              ...(isAdmin ? [{ href: safeRoute('reports.dashboard'), label: isArabic ? 'لوحة الإدارة' : 'Admin Panel', icon: ShieldCheck, admin: true }] : []),
          ]
        : [
              { href: safeRoute('sections.main'), label: t('store'), icon: Store },
              { href: safeRoute('login'), label: t('login'), icon: LogIn },
              { href: safeRoute('register'), label: t('register'), icon: UserCircle2 },
          ];

    const quickLinks = user
        ? [
              { href: safeRoute('wheel.index'), label: isArabic ? 'عجلة الفرصة' : 'Chance Wheel', icon: Sparkles, highlight: true, badge: user?.wheel_spins || 0 },
              { href: safeRoute('wallet.index'), label: t('wallet'), icon: Wallet },
              { href: safeRoute('giftCards.redeemPage'), label: 'Gift Card', icon: Gift },
              { href: safeRoute('support.index'), label: t('support'), icon: LifeBuoy },
          ]
        : [];

    const socialItems = [
        { key: 'whatsapp', href: socialLinks.whatsapp || '#', icon: MessageCircle },
        { key: 'instagram', href: socialLinks.instagram || '#', icon: Instagram },
        { key: 'telegram', href: socialLinks.telegram || '#', icon: Send },
        { key: 'facebook', href: socialLinks.facebook || '#', icon: Facebook },
    ];

    const drawerPositionClass = isArabic ? 'right-0 border-l' : 'left-0 border-r';
    const alignClass = isArabic ? 'text-right' : 'text-left';
    const rowClass = isArabic ? 'flex-row-reverse justify-between text-right' : 'justify-between text-left';
    const supportButtonSideClass = isArabic ? 'left-4 sm:left-5' : 'right-4 sm:right-5';

    return (
        <div dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_right,rgba(167,139,250,0.08),transparent_18%),linear-gradient(180deg,#f8fbff,#f4f8ff_55%,#ffffff)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),radial-gradient(circle_at_right,rgba(167,139,250,0.16),transparent_16%),linear-gradient(180deg,#020617,#0f172a_55%,#020617)]" />

            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
                <div dir={isArabic ? 'rtl' : 'ltr'} className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-none items-center gap-2">
                        <div className="relative" ref={optionsRef}>
                            <button
                                type="button"
                                onClick={() => setIsOptionsOpen((value) => !value)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                aria-label={t('menu')}
                                aria-expanded={isOptionsOpen}
                            >
                                {isOptionsOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>

                            {isOptionsOpen && (
                                <>
                                    <button type="button" aria-label="close menu overlay" onClick={closeMenu} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200" />
                                    <div dir={isArabic ? 'rtl' : 'ltr'} className={`fixed ${drawerPositionClass} top-0 z-50 flex h-screen w-[88vw] max-w-[360px] flex-col border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900 sm:top-16 sm:h-[calc(100vh-5rem)] sm:rounded-[28px] animate-[sh7nleDrawerSlideIn_200ms_ease-out_both]`}>
                                        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-5">
                                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className={alignClass}>
                                                    <div className="text-sm font-black text-slate-950 dark:text-white">{user?.name || appName || 'Sh7nle'}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('quickMenu')}</div>
                                                </div>
                                                {user ? (
                                                    <div className={`rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/35 ${alignClass}`}>
                                                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{t('balance')}</div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white">${Number(user.balance || 0).toFixed(2)}</div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {quickLinks.length ? (
                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                    {quickLinks.map((item) => {
                                                        const Icon = item.icon;
                                                        return (
                                                            <Link
                                                                key={item.label}
                                                                href={safeUrl(item.href)}
                                                                onClick={closeMenu}
                                                                className={`relative flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[26px] border px-3 py-4 text-center text-sm font-black transition hover:-translate-y-0.5 ${item.highlight ? 'border-amber-300 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-rose-500/20' : 'border-white/70 bg-white/90 text-slate-800 shadow-sm hover:bg-white dark:border-slate-700 dark:bg-slate-950/65 dark:text-slate-100 dark:hover:bg-slate-800'}`}
                                                            >
                                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.highlight ? 'bg-white/20' : 'bg-slate-100 text-sky-600 dark:bg-slate-800 dark:text-cyan-300'}`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <span>{item.label}</span>
                                                                {item.badge > 0 && <span className={`absolute -top-2 ${isArabic ? '-left-2' : '-right-2'} rounded-full bg-red-600 px-2 py-0.5 text-xs text-white`}>{item.badge}</span>}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            {menuLinks.map(({ href, label, icon: Icon, admin }) => (
                                                <Link
                                                    key={label}
                                                    href={safeUrl(href)}
                                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${admin ? 'bg-gradient-to-r from-sky-600 to-violet-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-500 hover:to-violet-500' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800'} ${rowClass}`}
                                                    onClick={closeMenu}
                                                >
                                                    <Icon className={`h-4 w-4 shrink-0 ${admin ? 'text-white' : 'text-sky-600'}`} />
                                                    <span>{label}</span>
                                                </Link>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setLocale(targetLocale)}
                                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800 ${rowClass}`}
                                            >
                                                <Languages className="h-4 w-4 shrink-0 text-sky-600" />
                                                <span>{isArabic ? `تغيير اللغة إلى ${targetLocaleName}` : `Change language to ${targetLocaleName}`}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsDark((value) => !value)}
                                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800 ${rowClass}`}
                                            >
                                                {isDark ? <Sun className="h-4 w-4 shrink-0 text-amber-500" /> : <Moon className="h-4 w-4 shrink-0 text-violet-600" />}
                                                <span>{isDark ? t('lightMode') : t('darkMode')}</span>
                                            </button>

                                            {isSuperAdmin ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('sh7nle:toggle-global-text-editor'));
                                                        closeMenu();
                                                    }}
                                                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40 ${rowClass}`}
                                                >
                                                    <Gift className="h-4 w-4 shrink-0" />
                                                    <span>{isArabic ? 'تعديل النصوص' : 'Edit texts'}</span>
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="mt-3 rounded-3xl border border-slate-200 p-3 dark:border-slate-700">
                                            <div className={`mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 ${alignClass}`}>{t('social')}</div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {socialItems.map(({ key, href, icon: Icon }) => (
                                                    <a
                                                        key={key}
                                                        href={safeUrl(href)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        {user ? (
                                            <Link href={safeRoute('logout')} method="post" as="button" className={`mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40 ${rowClass}`} onClick={closeMenu}>
                                                <LogOut className="h-4 w-4 shrink-0" />
                                                <span>{t('logout')}</span>
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                                </>
                            )}
                        </div>

                        {user ? (
                            <div className={`hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 md:flex dark:border-emerald-900/60 dark:bg-emerald-950/40 ${alignClass}`}>
                                <Wallet className="h-4 w-4 text-emerald-600" />
                                <div>
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300">{t('balance')}</div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">${Number(user.balance || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <Link href={safeRoute('sections.main')} className="group flex min-w-0 items-center gap-2 sm:gap-3">
                        <img src={brandLogo} alt={appName || 'Sh7nle'} className="h-11 w-11 flex-none rounded-2xl object-cover shadow-lg shadow-sky-500/20 sm:h-12 sm:w-12" />
                        <div className={`min-w-0 ${alignClass}`}>
                            <div className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">{appName || 'Sh7nle'}</div>
                            <div className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">{t('storeTagline')}</div>
                        </div>
                    </Link>


                </div>
            </header>

            {(flash?.success || flash?.warning || flash?.error) && (
                <div className="mx-auto mt-4 max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200' : flash?.warning ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>
                        {flash?.error || flash?.warning || flash?.success}
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                {children}
                {user && (
                    <Link href={safeRoute('support.index')} aria-label="supportFloatingButton" className={`fixed bottom-5 ${supportButtonSideClass} z-40 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-900 shadow-[0_16px_45px_rgba(14,165,233,0.28)] ring-1 ring-sky-100 transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(14,165,233,0.34)] dark:bg-slate-900 dark:text-white dark:ring-slate-700 sm:bottom-6`}>
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-white">
                            <MessageCircle className="h-7 w-7" />
                            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                        </span>
                        <span className="hidden text-right text-xs font-black sm:block">
                            <span className="block">الدعم</span>
                            <span className="block text-[10px] font-bold text-emerald-600">متاح الآن</span>
                        </span>
                    </Link>
                )}
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="font-bold">© 2026 Sh7nle. جميع الحقوق محفوظة.</div>
                    <div className="flex flex-wrap items-center justify-center gap-3 font-bold">
                        <Link href={safeRoute('legal.terms', undefined, '/terms')} className="hover:text-sky-600">الشروط والأحكام</Link>
                        <span className="text-slate-300">•</span>
                        <Link href={safeRoute('legal.privacy', undefined, '/privacy')} className="hover:text-sky-600">سياسة الخصوصية</Link>
                        <span className="text-slate-300">•</span>
                        <Link href={safeRoute('legal.agreement', undefined, '/user-agreement')} className="hover:text-sky-600">اتفاقية المستخدم</Link>
                        <span className="text-slate-300">•</span>
                        <Link href={safeRoute('support.index', undefined, '/support-tickets')} className="hover:text-sky-600">الدعم</Link>
                    </div>
                </div>
            </footer>
            <AutoTranslator />
            <GlobalTextEditor />
            <LoadingOverlay />
        </div>
    );
}

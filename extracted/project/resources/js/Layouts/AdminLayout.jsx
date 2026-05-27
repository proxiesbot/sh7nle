import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu, Moon, PencilLine, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingOverlay from '@/components/LoadingOverlay';
import GlobalTextEditor from '@/components/GlobalTextEditor';
import AutoTranslator from '@/components/AutoTranslator';
import { useSitePreferences } from '@/lib/sitePreferences';

export default function AdminLayout({ children, title }) {
    const brandLogo = '/images/brand/sh7nle-icon-192.png';
    const { auth = {}, flash, appName, adminCounters = {} } = usePage().props;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isDark, setIsDark } = useSitePreferences();

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const syncSidebar = () => setIsSidebarOpen(window.innerWidth >= 1024);
        syncSidebar();
        window.addEventListener('resize', syncSidebar);
        return () => window.removeEventListener('resize', syncSidebar);
    }, []);

    const navItems = [
        { name: 'الجرد والتقارير', href: route('reports.dashboard'), icon: '📊' },
        { name: 'فحص النظام', href: route('system.audit.index'), icon: '🛡️' },
        { name: 'المستخدمون', href: route('user.index'), icon: '👥' },
        { name: 'الدعم', href: route('support.admin.index'), icon: '💬' },
        { name: 'عجلة الفرصة', href: route('wheel.admin'), icon: '🎡' },
        { name: 'محفظة الموقع', href: route('wallet.admin.index'), icon: '🏦' },
        { name: 'طلبات الإيداع', href: route('deposit.index'), icon: '💰', badge: adminCounters.pendingDeposits || 0 },
        { name: 'الطلبات', href: route('payment.index'), icon: '🛍️', badge: adminCounters.pendingOrders || 0 },
        { name: 'طلبات أرباح الإحالة', href: route('referralWithdrawals.index'), icon: '🏧' },
        { name: 'الأقسام', href: route('sections.indexAdmin'), icon: '📁' },
        { name: 'المنتجات', href: route('card.index'), icon: '🎮' },
        { name: 'طرق الدفع', href: route('paymentMethods.index'), icon: '🏦' },
        { name: 'المزودات', href: route('providerSources.index'), icon: '🧩' },
        { name: 'مركز الاستيراد', href: route('importedProducts.index'), icon: '📥' },
        { name: 'إعدادات المتجر', href: route('settings.edit'), icon: '⚙️' },
        { name: 'روابط التواصل', href: `${route('settings.edit')}#social-links`, icon: '🔗' },
        { name: 'الاشعارات', href: route('notification.index'), icon: '🔔' },
        { name: 'البانرات', href: route('banners.index'), icon: '🖼️' },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100" dir="rtl">
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="close sidebar overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
                />
            )}

            <div className="flex min-h-screen min-w-0">
                <aside className={`fixed inset-y-0 right-0 z-50 flex w-[min(18rem,86vw)] flex-col bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition-transform duration-300 lg:static lg:z-auto lg:shadow-none ${isSidebarOpen ? 'translate-x-0 lg:w-72' : 'translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden'}`}>
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <img src={brandLogo} alt={appName || 'Sh7nle'} className="h-11 w-11 flex-none rounded-2xl object-cover shadow-lg shadow-sky-500/20" />
                            <span className="truncate bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-lg font-black text-transparent sm:text-xl">
                                {appName || 'Sh7nle'} Control
                            </span>
                        </div>
                        <button type="button" onClick={() => setIsSidebarOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white lg:hidden">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-100 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                                {item.badge ? (
                                    <span className="min-w-5 rounded-full bg-red-600 px-2 py-0.5 text-center text-xs font-black text-white">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        ))}

                        {/* Separator + User info + Logout at the end of nav (scrollable) */}
                        <div className="mt-4 border-t border-white/10 pt-4">
                            <div className="mb-3 flex items-center gap-3 px-4">
                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sky-500 font-bold">
                                    {auth.user?.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-bold">{auth.user?.name}</div>
                                    <div className="text-xs text-slate-400">لوحة الإدارة</div>
                                </div>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-100"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="min-w-0 flex-1 truncate font-medium">تسجيل الخروج</span>
                            </Link>
                        </div>
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="min-w-0 flex-1 truncate text-center text-lg font-black text-slate-900 dark:text-white sm:text-xl">{title}</h1>
                        <div className="flex flex-none items-center gap-2">
                            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('sh7nle:toggle-global-text-editor'))} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-black text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950">
                                <PencilLine className="h-4 w-4" />
                                <span className="hidden sm:inline">تعديل النصوص</span>
                            </button>
                            <button type="button" onClick={() => setIsDark(!isDark)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                <span className="hidden sm:inline">{isDark ? 'فاتح' : 'داكن'}</span>
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                        {(flash?.success || flash?.warning || flash?.error) && (
                            <div className={`mb-4 rounded-2xl border px-4 py-3 text-right text-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200' : flash?.warning ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
                                {flash?.error || flash?.warning || flash?.success}
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>

            <AutoTranslator />
            <GlobalTextEditor />
            <LoadingOverlay />
        </div>
    );
}

import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock3, Database, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

const levelStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

function LevelIcon({ level }) {
    if (level === 'danger') return <XCircle className="h-5 w-5" />;
    if (level === 'warning') return <AlertTriangle className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
}

function Stat({ title, value, icon: Icon }) {
    return (
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</div>
                    <div className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</div>
                </div>
            </div>
        </div>
    );
}

export default function Audit({ generatedAt, summary = {}, groups = [] }) {
    return (
        <AdminLayout title="فحص النظام">
            <Head title="فحص النظام" />

            <div className="space-y-6 text-right">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative p-6 sm:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_26%)]" />
                        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                                    <ShieldCheck className="h-4 w-4" />
                                    Stability Audit
                                </div>
                                <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">فحص استقرار المنصة</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    هذه الصفحة تجمع أهم مؤشرات الأمان، المحفظة، الطلبات، المنتجات، المزودات، النسخ الاحتياطي، والدعم حتى تعرف أين تحتاج المنصة إلى مراجعة قبل الإنتاج.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                    <Clock3 className="h-4 w-4" />
                                    {generatedAt}
                                </div>
                                <Button
                                    onClick={() => router.post(route('system.audit.restoreSystemData'), {}, { preserveScroll: true })}
                                    className="rounded-2xl bg-emerald-600 font-black hover:bg-emerald-700"
                                >
                                    <Database className="ml-2 h-4 w-4" /> تثبيت بيانات النظام
                                </Button>
                                <Button onClick={() => router.reload({ preserveScroll: true })} className="rounded-2xl bg-sky-600 font-black hover:bg-sky-700">
                                    <RefreshCw className="ml-2 h-4 w-4" /> تحديث الفحص
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    <Stat title="المستخدمون" value={summary.users ?? 0} icon={ShieldCheck} />
                    <Stat title="المنتجات" value={summary.cards ?? 0} icon={Database} />
                    <Stat title="منتجات فعالة" value={summary.activeCards ?? 0} icon={CheckCircle2} />
                    <Stat title="طلبات تحتاج متابعة" value={summary.pendingOrders ?? 0} icon={AlertTriangle} />
                    <Stat title="إيداعات معلقة" value={summary.pendingDeposits ?? 0} icon={Clock3} />
                    <Stat title="دعم مفتوح" value={summary.openSupport ?? 0} icon={RefreshCw} />
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    {groups.map((group) => (
                        <div key={group.title} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${levelStyles[group.score] || levelStyles.neutral}`}>
                                    <LevelIcon level={group.score} />
                                    {group.score === 'danger' ? 'يحتاج إصلاح' : group.score === 'warning' ? 'يحتاج مراجعة' : 'جيد'}
                                </span>
                                <div>
                                    <h2 className="text-xl font-black text-slate-950 dark:text-white">{group.title}</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {group.items.map((item, index) => (
                                    <div key={`${item.label}-${index}`} className={`rounded-2xl border p-4 ${levelStyles[item.level] || levelStyles.neutral}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="inline-flex items-center gap-2 text-sm font-black"><LevelIcon level={item.level} /> {item.value}</span>
                                            <span className="text-sm font-black">{item.label}</span>
                                        </div>
                                        <p className="mt-2 text-xs leading-6 opacity-85">{item.hint}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </AdminLayout>
    );
}

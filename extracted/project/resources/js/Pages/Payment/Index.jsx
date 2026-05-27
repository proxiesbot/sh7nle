import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { BadgeCheck, Check, ChevronDown, ChevronUp, Clock3, Copy, PackageSearch, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusMap = {
    0: { label: 'قيد الانتظار', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
    1: { label: 'مكتمل', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
    2: { label: 'مرفوض / مسترجع', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

function normalizeDeliveryText(payment) {
    const lines = [];
    if (payment?.delivered_codes) {
        lines.push(String(payment.delivered_codes).trim());
    }

    const details = payment?.delivery_details || {};
    const codes = details?.gift_card_codes || details?.codes || [];
    if (Array.isArray(codes) && codes.length) {
        lines.push(codes.join('\n'));
    }

    const seen = new Set();
    return lines
        .join('\n')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => {
            const key = line.replace(/\s+/g, '').toUpperCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .join('\n');
}

function formatDate(date) {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return date;
    }
}

export default function Payments({ payments }) {
    const [copiedKey, setCopiedKey] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpanded = (id) => {
        setExpandedId((current) => (current === id ? null : id));
    };

    const copyToClipboard = async (key, text) => {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
        } catch (exception) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'readonly');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(''), 1600);
    };

    return (
        <PublicLayout>
            <Head title="طلباتي" />

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10 text-right dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-left text-sm text-slate-500 dark:text-slate-400">{payments?.total ?? payments?.data?.length ?? 0} طلب</div>
                    <div>
                        <h1 className="text-2xl font-black sm:text-3xl text-slate-950 dark:text-white">طلباتي</h1>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">اضغط على السهم لعرض تفاصيل الطلب، الأكواد، وبيانات التسليم.</p>
                    </div>
                </div>
            </section>

            <div className="sh7nle-accordion-list mt-5 space-y-3">
                {(payments?.data || []).map((payment) => {
                    const status = statusMap[payment.status] || statusMap[0];
                    const StatusIcon = status.icon;
                    const deliveryText = normalizeDeliveryText(payment);
                    const codes = deliveryText ? deliveryText.split('\n').filter(Boolean) : [];
                    const allCopyKey = `payment-${payment.id}-all`;
                    const isOpen = expandedId === payment.id;
                    const orderId = payment.support_id || payment.orderId || `ORD-${payment.id}`;
                    const title = payment.card?.name || 'منتج غير معروف';

                    return (
                        <article key={payment.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={() => toggleExpanded(payment.id)}
                                className="flex w-full items-center gap-3 px-3 py-3 text-right sm:px-4"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${status.className}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {status.label}
                                        </span>
                                        <h2 className="truncate text-base font-black text-slate-950 dark:text-white sm:text-lg">{title}</h2>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{formatDate(payment.created_at)}</span>
                                        <span>•</span>
                                        <span dir="ltr" className="font-mono">{orderId}</span>
                                        <span>•</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">${Number(payment.price || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </button>

                            <div className={`smooth-reveal ${isOpen ? 'is-open' : ''}`}>
                                <div className="smooth-reveal-inner">
                                    <div className="border-t border-slate-100 px-3 pb-3 pt-2 text-right dark:border-slate-800 sm:px-4">
                                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">الكمية / القيمة</div><div className="mt-1 font-bold text-slate-950 dark:text-white">{payment.amount}</div></div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">القيمة المخصومة</div><div className="mt-1 font-bold text-slate-950 dark:text-white">${Number(payment.price || 0).toFixed(2)}</div></div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">معرف اللاعب</div><div className="mt-1 font-bold text-slate-950 dark:text-white break-all">{payment.destinationProfileId || '—'}</div></div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"><div className="text-xs text-slate-500 dark:text-slate-400">حالة المزود</div><div className="mt-1 font-bold text-slate-950 dark:text-white break-all">{payment.provider_status || '—'}</div></div>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                            {codes.length > 0 && (
                                                <Button
                                                    type="button"
                                                    onClick={() => copyToClipboard(allCopyKey, deliveryText)}
                                                    className="h-9 rounded-xl bg-sky-600 px-3 text-xs font-black text-white hover:bg-sky-700"
                                                >
                                                    {copiedKey === allCopyKey ? <Check className="ml-1 h-4 w-4" /> : <Copy className="ml-1 h-4 w-4" />}
                                                    {copiedKey === allCopyKey ? 'تم النسخ' : 'نسخ الكل'}
                                                </Button>
                                            )}
                                            <div className="flex items-center gap-2"><PackageSearch className="h-4 w-4 text-sky-600" /> الأكواد / تفاصيل التسليم</div>
                                        </div>
                                        {codes.length > 0 ? (
                                            <div className="space-y-2">
                                                {codes.map((code, index) => {
                                                    const key = `payment-${payment.id}-code-${index}`;
                                                    return (
                                                        <div key={key} className="flex items-start gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 dark:border-sky-900/60 dark:bg-slate-900">
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(key, code)}
                                                                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-200"
                                                                title="نسخ"
                                                            >
                                                                {copiedKey === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                            </button>
                                                            <div className="min-w-0 flex-1 break-all font-mono text-sm text-sky-800 dark:text-sky-200">{code}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{payment.status === 1 ? 'تم تنفيذ الطلب، وإذا كان هذا المنتج يسلّم أكواد فستظهر هنا بمجرد تجهيزها.' : 'لا توجد أكواد بعد. إذا كان الطلب قيد الانتظار فسيتم تحديث هذه الصفحة تلقائيًا عند إعادة فتحها.'}</div>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}

                {(payments?.data || []).length === 0 && <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">لا توجد طلبات حتى الآن.</div>}
            </div>

            {payments?.links && payments.links.length > 3 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {payments.links.map((link, index) => (
                        <Link key={index} href={link.url || '#'} className={`rounded-2xl px-4 py-2 text-sm ${link.active ? 'bg-sky-500 text-white' : 'bg-white text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </PublicLayout>
    );
}

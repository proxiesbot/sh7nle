import { Head, Link, useForm } from '@inertiajs/react';
import { ImagePlus } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import EditableText from '@/components/EditableText';

function Thread({ ticket, routeName, adminOnline = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({ message: '', attachment: null });
    const submit = (e) => {
        e.preventDefault();
        post(route(routeName, ticket.id), { forceFormData: true, preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <div className="space-y-5 text-right">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                    <Link href={routeName.includes('admin') ? route('support.admin.index') : route('support.index')} className="text-sm font-bold text-sky-600"><EditableText textKey="support.user.back" defaultText="رجوع" context="واجهة الزبون" /></Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white">{ticket.subject}</h1>
                        <div className="mt-1 text-xs text-slate-500">الحالة: {ticket.status} {adminOnline && !routeName.includes('admin') ? '• الدعم نشط الآن' : ''}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {ticket.messages.map((msg) => (
                    <div key={msg.id} className={`rounded-3xl border p-4 ${msg.is_admin ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                        <div className="mb-2 text-xs font-bold text-slate-500">{msg.is_admin ? 'الدعم' : (msg.user?.name || 'الزبون')} • {new Date(msg.created_at).toLocaleString()}</div>
                        <div className="whitespace-pre-wrap leading-7 text-slate-800 dark:text-slate-100">{msg.message}</div>
                        {msg.attachment_path && (
                            <a href={msg.attachment_path} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                                <img src={msg.attachment_path} alt={msg.attachment_original_name || 'attachment'} className="max-h-80 w-full object-contain" loading="lazy" />
                            </a>
                        )}
                    </div>
                ))}
            </div>

            {ticket.status !== 'closed' && (
                <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <textarea value={data.message} onChange={(e) => setData('message', e.target.value)} rows={5} placeholder="اكتب الرد..." className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    {errors.message && <div className="mt-1 text-sm text-rose-600">{errors.message}</div>}
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <ImagePlus className="h-4 w-4" />
                        {data.attachment ? data.attachment.name : 'إرفاق صورة اختيارية'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setData('attachment', e.target.files?.[0] || null)} />
                    </label>
                    {errors.attachment && <div className="mt-1 text-sm text-rose-600">{errors.attachment}</div>}
                    <Button disabled={processing} className="mt-3 rounded-2xl bg-sky-600 hover:bg-sky-700"><EditableText textKey="support.user.reply_submit" defaultText="إرسال الرد" context="واجهة الزبون" /></Button>
                </form>
            )}
        </div>
    );
}

export function UserShow({ ticket, adminOnline }) {
    return <PublicLayout><Head title={ticket.subject} /><Thread ticket={ticket} routeName="support.reply" adminOnline={adminOnline} /></PublicLayout>;
}

export function AdminShow({ ticket }) {
    return <AdminLayout title="الدعم"><Head title={ticket.subject} /><Thread ticket={ticket} routeName="support.admin.reply" /></AdminLayout>;
}

export default UserShow;

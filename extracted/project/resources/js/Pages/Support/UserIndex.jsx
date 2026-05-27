import { Head, Link, useForm } from '@inertiajs/react';
import { ImagePlus, MessageCircle } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EditableText from '@/components/EditableText';

export default function UserIndex({ tickets, adminOnline = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({ subject: '', message: '', attachment: null });

    const submit = (e) => {
        e.preventDefault();
        post(route('support.store'), { forceFormData: true, onSuccess: () => reset() });
    };

    return (
        <PublicLayout>
            <Head title="الدعم" />
            <div className="grid gap-6 lg:grid-cols-[1fr_390px] text-right">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                        <div className={`rounded-full px-3 py-1 text-xs font-black ${adminOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{adminOnline ? 'الدعم نشط الآن' : 'الدعم يرد بأقرب وقت'}</div>
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white"><EditableText textKey="support.user.title" defaultText="رسائل الدعم" context="واجهة الزبون" /></h1>
                    </div>
                    <div className="mt-6 space-y-3">
                        {tickets.data.map((ticket) => (
                            <Link key={ticket.id} href={route('support.show', ticket.id)} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === 'closed' ? 'bg-slate-200 text-slate-700' : ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : ticket.status === 'live' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>{ticket.status}</span>
                                    <div className="font-black text-slate-950 dark:text-white">{ticket.subject}</div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">{ticket.messages_count} رسالة • {new Date(ticket.updated_at).toLocaleString()}</div>
                            </Link>
                        ))}
                        {!tickets.data.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500"><EditableText textKey="support.user.empty" defaultText="لا توجد رسائل دعم بعد." context="واجهة الزبون" /></div>}
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-5 flex items-center justify-end gap-2">
                        <MessageCircle className="h-5 w-5 text-sky-600" />
                        <h2 className="text-xl font-black text-slate-950 dark:text-white"><EditableText textKey="support.user.new_title" defaultText="رسالة جديدة" context="واجهة الزبون" /></h2>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Input value={data.subject} onChange={(e) => setData('subject', e.target.value)} placeholder="عنوان الرسالة" className="text-right" />
                            {errors.subject && <div className="mt-1 text-sm text-rose-600">{errors.subject}</div>}
                        </div>
                        <div>
                            <textarea value={data.message} onChange={(e) => setData('message', e.target.value)} rows={6} placeholder="اكتب رسالتك..." className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                            {errors.message && <div className="mt-1 text-sm text-rose-600">{errors.message}</div>}
                        </div>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <ImagePlus className="h-4 w-4" />
                            {data.attachment ? data.attachment.name : 'إرفاق صورة اختيارية'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setData('attachment', e.target.files?.[0] || null)} />
                        </label>
                        {errors.attachment && <div className="text-sm text-rose-600">{errors.attachment}</div>}
                        <Button disabled={processing} className="w-full rounded-2xl bg-sky-600 hover:bg-sky-700">{adminOnline ? 'بدء محادثة مباشرة' : 'إرسال للدعم'}</Button>
                    </form>
                </section>
            </div>
        </PublicLayout>
    );
}

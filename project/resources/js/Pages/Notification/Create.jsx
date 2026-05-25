import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Create({ users }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        message: '',
        user_id: '',
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('notification.store'));
    };

    return (
        <AdminLayout title="إرسال إشعار">
            <Head title="إرسال إشعار" />
            <div className="max-w-3xl mx-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm text-right">
                <form onSubmit={submit} className="space-y-5">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">اترك المستخدم والبريد فارغين لإرسال إشعار عام لكل المستخدمين.</div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="user_id">اختيار مستخدم</Label>
                            <select id="user_id" value={data.user_id} onChange={(e) => { setData('user_id', e.target.value); if (e.target.value) setData('email', ''); }} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value="">إشعار عام</option>
                                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="email">أو عبر البريد</Label>
                            <Input id="email" value={data.email} onChange={(e) => { setData('email', e.target.value); if (e.target.value) setData('user_id', ''); }} className="mt-2" placeholder="اختياري" />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="title">العنوان</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} className="mt-2" />
                    </div>
                    <div>
                        <Label htmlFor="message">نص الإشعار</Label>
                        <textarea id="message" value={data.message} onChange={(e) => setData('message', e.target.value)} rows={5} className="mt-2 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                        {errors.message && <div className="mt-1 text-sm text-rose-600">{errors.message}</div>}
                    </div>
                    <div className="flex justify-end gap-3">
                        <Link href={route('notification.index')}><Button type="button" variant="outline">رجوع</Button></Link>
                        <Button type="submit" disabled={processing}>{processing ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}</Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

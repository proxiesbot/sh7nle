import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

export default function Index({ notifications }) {
    const { delete: destroy } = useForm();

    return (
        <AdminLayout title="الإشعارات">
            <Head title="الإشعارات" />
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <Link href={route('notification.create')}><Button>إرسال إشعار</Button></Link>
                    <div>
                        <h2 className="text-xl font-black text-slate-950">الإشعارات العامة والخاصة</h2>
                        <p className="mt-1 text-sm text-slate-500">يمكنك إرسال إشعار عام لكل المستخدمين أو إشعار مخصص لمستخدم واحد.</p>
                    </div>
                </div>
                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1000px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4">العنوان</th><th className="px-6 py-4">الرسالة</th><th className="px-6 py-4">المرسل إليه</th><th className="px-6 py-4">التاريخ</th><th className="px-6 py-4 text-left">إجراء</th></tr></thead>
                        <tbody>
                            {notifications.map((notification) => (
                                <tr key={notification.id} className="border-b border-slate-100 last:border-b-0">
                                    <td className="px-6 py-4 font-bold text-slate-900">{notification.title || 'بدون عنوان'}</td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xl">{notification.message}</td>
                                    <td className="px-6 py-4">{notification.receiver ? `${notification.receiver.name} (${notification.receiver.email})` : 'إشعار عام'}</td>
                                    <td className="px-6 py-4">{new Date(notification.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4"><Button variant="destructive" size="sm" onClick={() => confirm('حذف الإشعار؟') && destroy(route('notification.destroy', notification.id))}>حذف</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

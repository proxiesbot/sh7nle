import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

export default function Index({ banners }) {
    const { delete: destroy } = useForm();

    return (
        <AdminLayout title="البانرات">
            <Head title="البانرات" />
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <Link href={route('banners.create')}><Button>إضافة بانر</Button></Link>
                    <div>
                        <h2 className="text-xl font-black text-slate-950">بانرات الصفحة الرئيسية</h2>
                        <p className="mt-1 text-sm text-slate-500">البانر الأول النشط سيظهر للمستخدمين في الصفحة الرئيسية.</p>
                    </div>
                </div>
                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[900px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-4">البانر</th><th className="px-6 py-4">العنوان</th><th className="px-6 py-4">الترتيب</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4 text-left">إجراءات</th></tr></thead>
                        <tbody>
                            {banners.data.map((banner) => (
                                <tr key={banner.id} className="border-b border-slate-100 last:border-b-0">
                                    <td className="px-6 py-4">{banner.image ? <img src={banner.image} alt={banner.title} className="h-14 w-28 rounded-xl object-cover" /> : '—'}</td>
                                    <td className="px-6 py-4"><div className="font-bold text-slate-900">{banner.title}</div><div className="text-xs text-slate-500">{banner.subtitle}</div></td>
                                    <td className="px-6 py-4">{banner.sort_order}</td>
                                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{banner.is_active ? 'نشط' : 'موقف'}</span></td>
                                    <td className="px-6 py-4"><div className="flex justify-end gap-2"><Link href={route('banners.edit', banner.id)}><Button variant="outline" size="sm">تعديل</Button></Link><Button variant="destructive" size="sm" onClick={() => confirm('حذف البانر؟') && destroy(route('banners.destroy', banner.id))}>حذف</Button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

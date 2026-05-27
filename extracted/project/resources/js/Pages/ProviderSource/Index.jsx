import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

export default function Index({ providerSources }) {
    const { delete: destroy } = useForm();

    return (
        <AdminLayout title="مزودات المنتجات">
            <Head title="مزودات المنتجات" />

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden text-right">
                <div className="border-b border-slate-200 p-6 flex justify-between items-center">
                    <Link href={route('providerSources.create')}><Button>إضافة مزود</Button></Link>
                    <div>
                        <h2 className="text-xl font-black text-slate-950">مزودات المنتجات</h2>
                        <p className="mt-2 text-sm text-slate-500">أضف Sawa أو أي مزود REST آخر مع حقول mapping مخصصة.</p>
                    </div>
                </div>

                <div className="sh7nle-mobile-scroll">
                    <table className="w-full min-w-[1000px] text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">النوع</th>
                                <th className="px-6 py-4">Base URL</th>
                                <th className="px-6 py-4">Catalog</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providerSources.data.map((provider) => (
                                <tr key={provider.id} className="border-b border-slate-100 last:border-b-0">
                                    <td className="px-6 py-4"><div className="font-bold text-slate-900">{provider.name}</div><div className="text-xs text-slate-500">{provider.slug}</div></td>
                                    <td className="px-6 py-4">{provider.driver}</td>
                                    <td className="px-6 py-4">{provider.base_url || '—'}</td>
                                    <td className="px-6 py-4">{provider.supports_catalog ? 'نعم' : 'لا'}</td>
                                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${provider.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{provider.is_active ? 'نشط' : 'معطل'}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Link href={route('providerSources.edit', provider.id)}><Button variant="outline" size="sm">تعديل</Button></Link>
                                            <Button variant="destructive" size="sm" onClick={() => confirm('حذف المزود؟') && destroy(route('providerSources.destroy', provider.id))}>حذف</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

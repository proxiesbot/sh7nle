import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Edit({ banner }) {
    const { data, setData, post, processing } = useForm({ title: banner.title || '', subtitle: banner.subtitle || '', link: banner.link || '', sortOrder: banner.sort_order || 0, isActive: Number(banner.is_active), image: null });
    const submit = (e) => { e.preventDefault(); post(route('banners.update', banner.id)); };
    return (
        <AdminLayout title="تعديل بانر">
            <Head title="تعديل بانر" />
            <div className="max-w-3xl mx-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm text-right">
                <form onSubmit={submit} className="space-y-5">
                    <div><Label htmlFor="title">العنوان</Label><Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} className="mt-2" /></div>
                    <div><Label htmlFor="subtitle">النص الفرعي</Label><Input id="subtitle" value={data.subtitle} onChange={(e) => setData('subtitle', e.target.value)} className="mt-2" /></div>
                    <div><Label htmlFor="link">الرابط</Label><Input id="link" value={data.link} onChange={(e) => setData('link', e.target.value)} className="mt-2" /></div>
                    <div className="grid gap-5 md:grid-cols-2"><div><Label htmlFor="sortOrder">الترتيب</Label><Input id="sortOrder" type="number" value={data.sortOrder} onChange={(e) => setData('sortOrder', e.target.value)} className="mt-2" /></div><div><Label htmlFor="isActive">الحالة</Label><select id="isActive" value={data.isActive} onChange={(e) => setData('isActive', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value={1}>نشط</option><option value={0}>موقف</option></select></div></div>
                    <div><Label htmlFor="image">الصورة</Label><div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">المقاس المقترح للبانر: 1600×600 بكسل</div>{banner.image && <img src={banner.image} alt={banner.title} className="my-3 h-28 w-full rounded-2xl object-cover" />}<Input id="image" type="file" accept="image/*" onChange={(e) => setData('image', e.target.files[0])} className="mt-2" /></div>
                    <div className="flex justify-end gap-3"><Link href={route('banners.index')}><Button type="button" variant="outline">رجوع</Button></Link><Button type="submit" disabled={processing}>{processing ? 'جارٍ الحفظ...' : 'حفظ'}</Button></div>
                </form>
            </div>
        </AdminLayout>
    );
}

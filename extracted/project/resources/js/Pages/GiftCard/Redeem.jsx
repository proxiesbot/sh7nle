import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Redeem() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });
    return (
        <PublicLayout>
            <Head title="شحن غيفت كارد" />
            <section className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">شحن باستخدام غيفت كارد شحنلي</h1>
                <p className="mt-2 text-sm leading-7 text-slate-500">أدخل كود البطاقة ليتم شحن قيمتها تلقائيًا إلى رصيدك.</p>
                <form onSubmit={(e)=>{e.preventDefault(); post(route('giftCards.redeem'));}} className="mt-6 space-y-4">
                    <Input value={data.code} onChange={(e)=>setData('code', e.target.value)} placeholder="SH7-XXXX-XXXX-XXXX" />
                    {errors.code && <div className="text-sm text-rose-600">{errors.code}</div>}
                    <Button disabled={processing} className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700">شحن البطاقة</Button>
                </form>
            </section>
        </PublicLayout>
    );
}

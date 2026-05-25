import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';

export default function Docs({ apiToken, baseUrl, user }) {
    return (
        <PublicLayout>
            <Head title="API" />

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm text-right">
                <div className="text-sm text-sky-600 font-bold">مستوى API</div>
                <h1 className="mt-2 text-3xl font-black text-slate-950">واجهة الربط الخاصة بك</h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">يمكنك استخدام هذا التوكن لربط متجرك الخارجي مع منتجات موقعك وأسعارك الحالية.</p>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm text-right">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">Base URL</div>
                        <div className="mt-2 font-mono text-sm break-all">{baseUrl}</div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(apiToken)}>نسخ التوكن</Button>
                            <div className="text-left">
                                <div className="text-xs text-slate-500">API Token</div>
                                <div className="mt-2 font-mono text-sm break-all">{apiToken}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <h2 className="font-black text-slate-900">المصادقة</h2>
                            <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-xs text-slate-100">{`Authorization: Bearer ${apiToken}`}</pre>
                        </div>

                        <div>
                            <h2 className="font-black text-slate-900">جلب كل المنتجات</h2>
                            <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-xs text-slate-100">{`GET ${baseUrl}/products`}</pre>
                        </div>

                        <div>
                            <h2 className="font-black text-slate-900">جلب منتج واحد</h2>
                            <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-xs text-slate-100">{`GET ${baseUrl}/products/123`}</pre>
                        </div>

                        <div>
                            <h2 className="font-black text-slate-900">إنشاء طلب</h2>
                            <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-xs text-slate-100">{`POST ${baseUrl}/orders
{
  "card_id": 123,
  "amount": 1,
  "user_id": "123456789",
  "secondary_user_id": "",
  "provider_value": ""
}`}</pre>
                        </div>

                        <div>
                            <h2 className="font-black text-slate-900">جلب الطلبات</h2>
                            <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-xs text-slate-100">{`GET ${baseUrl}/orders`}</pre>
                        </div>
                    </div>
                </div>

                <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm text-right">
                    <div className="text-xs text-slate-500">الحساب</div>
                    <div className="mt-2 font-bold text-slate-900">{user.name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">مستوى العميل الحالي: {user.customer_level}</div>
                    <div className="mt-4 text-xs leading-6 text-slate-500">هذه الواجهة تعيد كل منتجات الموقع مع الأسعار الفعلية الخاصة بحسابك، لتتمكن من جلبها ثم تخصيص الصور والأيقونات ضمن موقعك الخارجي.</div>
                </aside>
            </section>
        </PublicLayout>
    );
}

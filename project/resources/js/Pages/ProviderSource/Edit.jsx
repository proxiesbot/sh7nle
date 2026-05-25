import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Edit({ providerSource = null }) {
    const { data, setData, put, processing, errors } = useForm({
        name: providerSource?.name || '',
        slug: providerSource?.slug || '',
        driver: providerSource?.driver || 'generic',
        baseUrl: providerSource?.base_url || '',
        apiToken: providerSource?.api_token || '',
        authHeader: providerSource?.auth_header || 'api-token',
        authPrefix: providerSource?.auth_prefix || '',
        catalogEndpoint: providerSource?.catalog_endpoint || '',
        productEndpoint: providerSource?.product_endpoint || '',
        orderEndpoint: providerSource?.order_endpoint || '',
        checkEndpoint: providerSource?.check_endpoint || '',
        supportsCatalog: providerSource?.supports_catalog ? 1 : 0,
        isActive: providerSource ? (providerSource.is_active ? 1 : 0) : 1,
        configJson: providerSource?.config_json || `{
  "catalog_categories_path": "data.categories",
  "catalog_products_path": "data.products",
  "catalog_tree_endpoint": "/content/{parentId}",
  "catalog_fallback_endpoint": "/products",
  "catalog_fallback_products_path": "__root__",
  "product_data_path": "__root__",
  "order_data_path": "data",
  "check_data_path": "data",
  "order_http_method": "post",
  "field_map": {
    "id": "id",
    "name": "name",
    "price": "price",
    "base_price": "base_price",
    "product_type": "product_type",
    "params": "params",
    "qty_values": "qty_values",
    "category_name": "category_name",
    "parent_id": "parent_id",
    "available": "available"
  }
}`,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('providerSources.update', providerSource.id));
    };

    return (
        <AdminLayout title={providerSource ? 'تعديل مزود' : 'إضافة مزود'}>
            <Head title={providerSource ? 'تعديل مزود' : 'إضافة مزود'} />

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6 text-right">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label htmlFor="name">اسم المزود</Label><Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-2" /></div>
                        <div><Label htmlFor="slug">Slug</Label><Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} className="mt-2" /></div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label htmlFor="driver">نوع المزود</Label><select id="driver" value={data.driver} onChange={(e) => setData('driver', e.target.value)} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="sawa">Sawa-compatible</option><option value="generic">Generic REST</option>
                                    <option value="swgames">SW Games</option></select></div>
                        <div><Label htmlFor="baseUrl">Base URL</Label><Input id="baseUrl" value={data.baseUrl} onChange={(e) => setData('baseUrl', e.target.value)} className="mt-2" /></div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label htmlFor="apiToken">API Token</Label><Input id="apiToken" value={data.apiToken} onChange={(e) => setData('apiToken', e.target.value)} className="mt-2" /></div>
                        <div><Label htmlFor="authHeader">اسم هيدر التوكن</Label><Input id="authHeader" value={data.authHeader} onChange={(e) => setData('authHeader', e.target.value)} className="mt-2" /></div>
                    </div>

                    <div><Label htmlFor="authPrefix">بادئة التوكن (مثل Bearer )</Label><Input id="authPrefix" value={data.authPrefix} onChange={(e) => setData('authPrefix', e.target.value)} className="mt-2" /></div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setData({
                                    ...data,
                                    name: 'Shams4Store',
                                    slug: 'shams4store',
                                    driver: 'generic',
                                    baseUrl: 'https://api.shams4store.com/client/api',
                                    authHeader: 'api-token',
                                    apiToken: '',
                                    authPrefix: '',
                                    catalogEndpoint: '/content/{parentId}',
                                    productEndpoint: '/products?products_id={id}',
                                    orderEndpoint: '/newOrder/{id}/params',
                                    checkEndpoint: '/check',
                                    supportsCatalog: 1,
                                    isActive: 1,
                                    configJson: `{
  "catalog_categories_path": "data.categories",
  "catalog_products_path": "data.products",
  "catalog_tree_endpoint": "/content/{parentId}",
  "catalog_fallback_endpoint": "/products",
  "catalog_fallback_products_path": "__root__",
  "product_data_path": "__root__",
  "order_data_path": "data",
  "check_data_path": "data",
  "order_http_method": "post",
  "field_map": {
    "id": "id",
    "name": "name",
    "price": "price",
    "base_price": "price",
    "image": "image",
    "product_type": "product_type",
    "params": "params",
    "qty_values": "qty_values",
    "category_name": "category_name",
    "parent_id": "parent_id",
    "available": "available"
  }
}`
                                });
                            }}
                        >
                            تعبئة تلقائية لـ Shams4Store
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <div><Label htmlFor="catalogEndpoint">Catalog Endpoint</Label><Input id="catalogEndpoint" value={data.catalogEndpoint} onChange={(e) => setData('catalogEndpoint', e.target.value)} className="mt-2" placeholder="/content/{parentId}" /></div>
                        <div><Label htmlFor="productEndpoint">Product Endpoint</Label><Input id="productEndpoint" value={data.productEndpoint} onChange={(e) => setData('productEndpoint', e.target.value)} className="mt-2" placeholder="/products?products_id={id}" /></div>
                        <div><Label htmlFor="orderEndpoint">Order Endpoint</Label><Input id="orderEndpoint" value={data.orderEndpoint} onChange={(e) => setData('orderEndpoint', e.target.value)} className="mt-2" placeholder="/newOrder/{id}/params" /></div>
                        <div><Label htmlFor="checkEndpoint">Check Endpoint</Label><Input id="checkEndpoint" value={data.checkEndpoint} onChange={(e) => setData('checkEndpoint', e.target.value)} className="mt-2" placeholder="/check" /></div>
                    </div>

                    <div>
                        <Label htmlFor="configJson">JSON Mapping</Label>
                        <textarea id="configJson" rows={16} value={data.configJson} onChange={(e) => setData('configJson', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm" />
                        <div className="mt-2 text-xs text-slate-500">يمكنك تعريف مسارات categories / products / data وأسماء الحقول باستخدام JSON.</div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label htmlFor="supportsCatalog">يدعم استعراض الأقسام؟</Label><select id="supportsCatalog" value={data.supportsCatalog} onChange={(e) => setData('supportsCatalog', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value={1}>نعم</option><option value={0}>لا</option></select></div>
                        <div><Label htmlFor="isActive">الحالة</Label><select id="isActive" value={data.isActive} onChange={(e) => setData('isActive', Number(e.target.value))} className="mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value={1}>نشط</option><option value={0}>معطل</option></select></div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href={route('providerSources.index')}><Button type="button" variant="outline">رجوع</Button></Link>
                        <Button type="submit" disabled={processing}>{processing ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

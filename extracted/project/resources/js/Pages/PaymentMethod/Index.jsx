import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import EditableText from '@/components/EditableText';

const providerLabels = {
    manual: 'يدوي',
    syriatel_cash: 'Syriatel Cash',
    sham_cash: 'ShamCash',
    kazawallet_manual: 'KazaWallet يدوي',
    bank_transfer: 'تحويل بنكي / حوالة',
    binance: 'Binance',
    coinex: 'CoinEx',
    faucetpay: 'FaucetPay',
    cryptopayment: 'CryptoPayment',
    kazawallet: 'Kazawallet',
    apisyria_syriatel: 'Syriatel Cash / API Syria',
    apisyria_shamcash: 'ShamCash / API Syria',
};

export default function Index({ paymentMethods, filters = {} }) {
    const { delete: destroy } = useForm();

    const handleTypeChange = (event) => {
        router.get(route('paymentMethods.index'), { type: event.target.value || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف طريقة الدفع؟')) {
            destroy(route('paymentMethods.destroy', id));
        }
    };

    return (
        <AdminLayout title="طرق الدفع">
            <Head title="Payment Methods" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white"><EditableText textKey="payment_methods.index.title" defaultText="طرق الدفع" context="طرق الدفع" /></h2>
                        <select value={filters.type || ''} onChange={handleTypeChange} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                            <option value="">الكل</option>
                            <option value="manual">يدوي</option>
                            <option value="automatic">أوتوماتيكي</option>
                        </select>
                    </div>
                    <Link href={route('paymentMethods.create')}>
                        <Button className="bg-purple-600 hover:bg-purple-700"><EditableText textKey="payment_methods.index.add_button" defaultText="إضافة طريقة" context="طرق الدفع" /></Button>
                    </Link>
                </div>

                <div className="sh7nle-mobile-scroll">
                    <table className="w-full text-right text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.image_header" defaultText="الصورة" context="طرق الدفع" /></th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.name_header" defaultText="الاسم" context="طرق الدفع" /></th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.provider_header" defaultText="المزوّد" context="طرق الدفع" /></th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.type_header" defaultText="النوع" context="طرق الدفع" /></th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.requirements_header" defaultText="المتطلبات" context="طرق الدفع" /></th>
                                <th className="px-6 py-4"><EditableText textKey="payment_methods.index.status_header" defaultText="الحالة" context="طرق الدفع" /></th>
                                <th className="px-6 py-4 text-left"><EditableText textKey="payment_methods.index.actions_header" defaultText="الإجراءات" context="طرق الدفع" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paymentMethods.data.map((method) => (
                                <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">#{method.id}</td>
                                    <td className="px-6 py-4">
                                        {method.image ? (
                                            <img src={method.image} alt={method.name} className="h-10 w-10 object-cover rounded-lg" />
                                        ) : (
                                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs">—</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{method.name}</td>
                                    <td className="px-6 py-4">{providerLabels[method.provider] || method.provider || 'يدوي'}</td>
                                    <td className="px-6 py-4">{method.is_automatic ? 'أوتوماتيكي' : 'يدوي'}</td>
                                    <td className="px-6 py-4 text-xs">
                                        {method.is_automatic ? 'لا يطلب من الزبون مرفقات' : [method.requires_payment_id ? 'رقم عملية' : null, method.requires_image ? 'صورة' : null].filter(Boolean).join(' + ') || 'بدون متطلبات'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${method.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {method.status ? 'مفعلة' : 'معطلة'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-left space-x-2 whitespace-nowrap">
                                        <Link href={route('paymentMethods.edit', method.id)}>
                                            <Button variant="outline" size="sm">تعديل</Button>
                                        </Link>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(method.id)}>
                                            حذف
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {paymentMethods.data.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">لا توجد طرق دفع حتى الآن.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Deposits({ deposits }) {
    return (
        <PublicLayout>
            <Head title="My Deposits" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Deposits</h1>
                    <Link
                        href={route('deposit.create')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        + New Deposit
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="sh7nle-mobile-scroll">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {deposits.data.map((deposit) => (
                                    <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">#{deposit.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {deposit.payment_method?.name || 'Unknown Method'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            ${deposit.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${deposit.status === 1 ? 'bg-green-100 text-green-600' :
                                                    deposit.status === 2 ? 'bg-red-100 text-red-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {deposit.status === 1 ? 'Approved' : deposit.status === 2 ? 'Rejected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(deposit.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {deposits.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No deposits found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                        {deposits.links && (
                            <div className="flex gap-1">
                                {deposits.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-3 py-1 rounded-md text-sm ${link.active
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            } ${!link.url && 'opacity-50 pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

export default function Index({ subcategories }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this subcategory?')) {
            destroy(route('subcategory.destroy', id));
        }
    };

    return (
        <AdminLayout title="Subcategory Management">
            <Head title="Subcategories" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Subcategories</h2>
                    <Link href={route('subcategory.create')}>
                        <Button className="bg-purple-600 hover:bg-purple-700">Add Subcategory</Button>
                    </Link>
                </div>

                <div className="sh7nle-mobile-scroll">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {subcategories.data.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">#{sub.id}</td>
                                    <td className="px-6 py-4">
                                        {sub.image ? (
                                            <img src={sub.image} alt={sub.name} className="h-10 w-10 object-cover rounded-lg" />
                                        ) : (
                                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs">No Img</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sub.name}</td>
                                    <td className="px-6 py-4">{sub.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${sub.status === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {sub.status === 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link href={route('subcategory.edit', sub.id)}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(sub.id)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                    {subcategories.links && (
                        <div className="flex gap-1">
                            {subcategories.links.map((link, i) => (
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
        </AdminLayout>
    );
}

import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';

export default function Index({ sections }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this section?')) {
            destroy(route('sections.destroy', id));
        }
    };

    return (
        <AdminLayout title="Section Management">
            <Head title="Sections" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Sections</h2>
                    <Link href={route('sections.create')}>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            + Add Section
                        </Button>
                    </Link>
                </div>

                <div className="sh7nle-mobile-scroll">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-300">
                            <tr>

                                <th className="px-6 py-4">Icon</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Sub sections</th>
                                <th className="px-6 py-4">Direct products</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sections.data.map((section) => (
                                <tr key={section.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">

                                    <td className="px-6 py-4">
                                        {section.icon ? (
                                            <img src={section.icon} alt="" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <span className="text-2xl">📁</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {section.name}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{section.sub_sections_count ?? 0}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{section.cards_count ?? 0}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link href={route('sections.manage', section.id)}>
                                            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">Manage</Button>
                                        </Link>
                                        <Link href={route('sections.edit', section.id)}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(section.id)}
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
                    {sections.links && (
                        <div className="flex gap-1">
                            {sections.links.map((link, i) => (
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

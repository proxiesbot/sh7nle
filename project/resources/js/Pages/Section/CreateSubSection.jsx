import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateSubSection({ section }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: section.id, // Assuming section is the category
        image: null,
        status: 1,
    });

    const submit = (e) => {
        e.preventDefault();
        // Assuming it posts to subcategory.store or a specific route?
        // Usually subcategory.store
        post(route('subcategory.store'));
    };

    return (
        <AdminLayout title={`Add Sub-Section to ${section.name}`}>
            <Head title="Add Sub-Section" />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Sub-Section to {section.name}</h2>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Hidden Category ID */}
                    <input type="hidden" value={data.category_id} />

                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div>
                        <Label htmlFor="image">Image</Label>
                        <Input
                            id="image"
                            type="file"
                            onChange={(e) => setData('image', e.target.files[0])}
                            className="mt-1 block w-full"
                            accept="image/*"
                        />
                        {errors.image && <div className="text-red-500 text-sm mt-1">{errors.image}</div>}
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData('status', parseInt(e.target.value))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                        {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Link href={route('sections.indexAdmin')}>
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            Create Sub-Section
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

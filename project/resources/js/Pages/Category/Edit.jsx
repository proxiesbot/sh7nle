import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Edit({ category }) {
    const { data, setData, post, processing, errors } = useForm({
        name: category.name || '',
        image: null,
        status: category.status ?? 1,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('category.update', category.id));
    };

    return (
        <AdminLayout title="Edit Category">
            <Head title="Edit Category" />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Category</h2>
                </div>

                <form onSubmit={submit} className="space-y-6">
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
                        {category.image && (
                            <div className="mb-2">
                                <img src={category.image} alt="Current" className="h-16 w-16 object-cover rounded-lg border" />
                            </div>
                        )}
                        <Input
                            id="image"
                            type="file"
                            onChange={(e) => setData('image', e.target.files[0])}
                            className="mt-1 block w-full"
                            accept="image/*"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image.</p>
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
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>إلغاء</Button>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            تحديث التصنيف
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

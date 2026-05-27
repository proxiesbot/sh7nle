import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Edit({ section }) {
    const { data, setData, post, processing, errors } = useForm({
        name: section.name || '',
        description: section.description || '',
        icon: null,
        backgroundImage: null,
        _method: 'PUT',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('sections.update', section.id));
    };

    return (
        <AdminLayout title={`Edit Section: ${section.name}`}>
            <Head title="Edit Section" />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <Label htmlFor="name">Section Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1"
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                        />
                        {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="icon">New Icon (Optional)</Label>
                            <Input
                                id="icon"
                                type="file"
                                onChange={(e) => setData('icon', e.target.files[0])}
                                className="mt-1"
                            />
                            {errors.icon && <div className="text-red-500 text-sm mt-1">{errors.icon}</div>}
                        </div>
                        {section.icon && (
                            <div className="mt-6">
                                <p className="text-xs text-gray-500 mb-1">Current Icon:</p>
                                <img src={section.icon} alt="Current Icon" className="h-10 w-10 object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="backgroundImage">New Background (Optional)</Label>
                            <Input
                                id="backgroundImage"
                                type="file"
                                onChange={(e) => setData('backgroundImage', e.target.files[0])}
                                className="mt-1"
                            />
                            {errors.backgroundImage && <div className="text-red-500 text-sm mt-1">{errors.backgroundImage}</div>}
                        </div>
                        {section.background && (
                            <div className="mt-6">
                                <p className="text-xs text-gray-500 mb-1">Current Background:</p>
                                <img src={section.background} alt="Current Background" className="h-10 w-20 object-cover rounded" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Link href={route('sections.indexAdmin')}>
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

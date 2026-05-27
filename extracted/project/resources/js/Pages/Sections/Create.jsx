import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have this or use standard textarea

export default function Create({ section = null }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        icon: null,
        backgroundImage: null,
        sectionId: section?.id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('sections.store'));
    };

    return (
        <AdminLayout title={section ? `إضافة قسم فرعي داخل ${section.name}` : 'Create New Section'}>
            <Head title={section ? `Add Sub Section to ${section.name}` : 'Create Section'} />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={submit} className="space-y-6">
                    {section && (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-right text-sm text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                            سيتم إنشاء هذا القسم كقسم فرعي داخل: <span className="font-bold">{section.name}</span>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="name">Section Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Games, Gift Cards"
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                            placeholder="Short description..."
                        />
                        {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                    </div>

                    <div>
                        <Label htmlFor="icon">Icon (Image)</Label>
                        <Input
                            id="icon"
                            type="file"
                            onChange={(e) => setData('icon', e.target.files[0])}
                            className="mt-1"
                        />
                        {errors.icon && <div className="text-red-500 text-sm mt-1">{errors.icon}</div>}
                    </div>

                    <div>
                        <Label htmlFor="backgroundImage">Background Image (Optional)</Label>
                        <Input
                            id="backgroundImage"
                            type="file"
                            onChange={(e) => setData('backgroundImage', e.target.files[0])}
                            className="mt-1"
                        />
                        {errors.backgroundImage && <div className="text-red-500 text-sm mt-1">{errors.backgroundImage}</div>}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Link href={section ? route('sections.manage', section.id) : route('sections.indexAdmin')}>
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            Create Section
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CreateCard({ section }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        price: '',
        section_id: section.id,
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('card.store'));
    };

    return (
        <AdminLayout title={`Add Card to ${section.name}`}>
            <Head title="Add Card" />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Card to {section.name}</h2>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Hidden Section ID */}
                    <input type="hidden" value={data.section_id} />

                    <div>
                        <Label htmlFor="name">Card Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1"
                            placeholder="e.g., $10 Gift Card"
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className="mt-1"
                        />
                        {errors.price && <div className="text-red-500 text-sm mt-1">{errors.price}</div>}
                    </div>

                    <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="mt-1"
                            rows={3}
                        />
                        {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                    </div>

                    <div>
                        <Label htmlFor="image">Card Image</Label>
                        <Input
                            id="image"
                            type="file"
                            onChange={(e) => setData('image', e.target.files[0])}
                            className="mt-1"
                            accept="image/*"
                        />
                        {errors.image && <div className="text-red-500 text-sm mt-1">{errors.image}</div>}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Link href={route('sections.indexAdmin')}>
                            <Button variant="outline" type="button">إلغاء</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            Create Card
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

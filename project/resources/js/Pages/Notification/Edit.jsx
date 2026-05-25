import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Edit({ notification, users }) {
    const { data, setData, post, processing, errors } = useForm({
        title: notification.title || '',
        message: notification.message || notification.content || '',
        user_id: notification.user_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('notification.update', notification.id));
    };

    return (
        <AdminLayout title="Edit Notification">
            <Head title="Edit Notification" />

            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Notification</h2>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <Label htmlFor="user_id">User</Label>
                        <select
                            id="user_id"
                            value={data.user_id}
                            onChange={(e) => setData('user_id', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">All Users</option>
                            {users && users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                        {errors.user_id && <div className="text-red-500 text-sm mt-1">{errors.user_id}</div>}
                    </div>

                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                    </div>

                    <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            className="mt-1 block w-full"
                            rows={4}
                        />
                        {errors.message && <div className="text-red-500 text-sm mt-1">{errors.message}</div>}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Link href={route('notification.index')}>
                            <Button variant="outline" type="button">إلغاء</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                            تحديث الإشعار
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

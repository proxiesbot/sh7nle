import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Notifications({ notifications = [] }) {
    const items = Array.isArray(notifications) ? notifications : notifications?.data || [];

    return (
        <PublicLayout>
            <Head title="الإشعارات" />

            <div className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white px-5 py-8 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="mb-8 text-3xl font-black text-slate-950 dark:text-white">الإشعارات</h1>

                <div className="space-y-4">
                    {items.map((notification) => (
                        <div
                            key={notification.id}
                            className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div className="mb-2 flex items-start justify-between gap-4">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                    {notification.title}
                                </h3>
                            </div>
                            <p className="leading-7 text-slate-600 dark:text-slate-300">
                                {notification.message || notification.content}
                            </p>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="rounded-[24px] border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
                            <div className="mb-3 text-4xl">🔕</div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">لا توجد إشعارات</h3>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">أنت مطّلع على كل جديد حاليًا.</p>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

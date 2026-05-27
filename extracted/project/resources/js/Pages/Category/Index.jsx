import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Index({ categories }) {
    return (
        <PublicLayout>
            <Head title="Categories" />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">All Categories</h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categories.data.map((category) => (
                        <Link
                            key={category.id}
                            href={route('category.getSubcategories', category.id)} // Assuming this route exists based on web.php: Route::get('category/{category}/getSubcategories', ...)
                            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        📁
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                    {category.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>

                {categories.data.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No categories found.
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

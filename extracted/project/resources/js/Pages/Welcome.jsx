import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" >
                <meta name="description" content="منصة شحن ألعاب وخدمات رقمية بأسعار مناسبة وطرق دفع متعددة." />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
                <div className="container mx-auto px-4 py-10 sm:py-16">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold sm:text-6xl text-white mb-4">
                            🎉 React + Inertia.js
                        </h1>
                        <p className="text-xl text-white/90 sm:text-2xl mb-2">
                            Successfully Integrated!
                        </p>
                        <p className="text-lg text-white/80">
                            Your Laravel app is now powered by React ⚛️
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8 mb-12">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="text-4xl mb-4">⚛️</div>
                            <h3 className="text-xl font-bold text-white mb-2">React 18</h3>
                            <p className="text-white/80">
                                Modern React with hooks, concurrent features, and automatic batching
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-bold text-white mb-2">Inertia.js</h3>
                            <p className="text-white/80">
                                Build SPAs without building an API - seamless Laravel integration
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:transform hover:scale-105">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-bold text-white mb-2">shadcn/ui</h3>
                            <p className="text-white/80">
                                Beautiful, accessible components built with Radix UI and Tailwind
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid gap-3 text-center sm:flex sm:justify-center sm:space-x-4">
                        <Link href="/login">
                            <Button
                                variant="default"
                                size="lg"
                                className="bg-white text-purple-600 hover:bg-white/90 font-semibold text-base px-6 py-5 sm:text-lg sm:px-8 sm:py-6"
                            >
                                Go to Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white text-white hover:bg-white/10 font-semibold text-base px-6 py-5 sm:text-lg sm:px-8 sm:py-6"
                            >
                                Create Account
                            </Button>
                        </Link>
                    </div>

                    {/* Tech Stack Info */}
                    <div className="mt-16 bg-white/10 backdrop-blur-lg rounded-2xl p-5 sm:p-8 border border-white/20">
                        <h3 className="text-2xl font-bold text-white mb-4 text-center">
                            Tech Stack
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4 text-center">
                            <div className="text-white/90">
                                <div className="font-semibold">Laravel</div>
                                <div className="text-sm text-white/70">Backend</div>
                            </div>
                            <div className="text-white/90">
                                <div className="font-semibold">React 18</div>
                                <div className="text-sm text-white/70">Frontend</div>
                            </div>
                            <div className="text-white/90">
                                <div className="font-semibold">Inertia.js</div>
                                <div className="text-sm text-white/70">Bridge</div>
                            </div>
                            <div className="text-white/90">
                                <div className="font-semibold">Tailwind CSS</div>
                                <div className="text-sm text-white/70">Styling</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

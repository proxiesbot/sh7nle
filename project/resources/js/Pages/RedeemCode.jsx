import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RedeemCode() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('redeemCode.redeem'));
    };

    return (
        <>
            <Head title="Redeem Code" />

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white p-6">
                <div className="max-w-md mx-auto">
                    <Link href={route('dashboard')} className="text-gray-400 hover:text-white mb-6 inline-block">
                        &larr; Back to Dashboard
                    </Link>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                🎟️
                            </div>
                            <h1 className="text-2xl font-bold">Redeem a Code</h1>
                            <p className="text-gray-400 text-sm mt-2">Enter your top-up code to add balance to your account.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <Label htmlFor="code" className="text-gray-300">Redeem Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    className="bg-white/10 border-white/20 text-white mt-1"
                                    placeholder="Enter code"
                                />
                                {errors.code && <div className="text-red-500 text-sm mt-1">{errors.code}</div>}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3">
                                {processing ? 'Redeeming...' : 'Redeem'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function LoadingOverlay() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => setVisible(true));
        const removeFinish = router.on('finish', () => setVisible(false));
        const removeError = router.on('error', () => setVisible(false));
        const removeInvalid = router.on('invalid', () => setVisible(false));

        return () => {
            removeStart?.();
            removeFinish?.();
            removeError?.();
            removeInvalid?.();
        };
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/95 px-8 py-7 text-center shadow-2xl dark:bg-slate-900/95">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
                    <div className="text-lg font-black text-slate-900 dark:text-white">شحنلي</div>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">جارٍ تحميل الصفحة...</div>
            </div>
        </div>
    );
}

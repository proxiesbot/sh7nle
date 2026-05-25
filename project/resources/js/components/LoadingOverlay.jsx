import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export default function LoadingOverlay() {
    const [visible, setVisible] = useState(false);
    const [show, setShow] = useState(false);
    const delayRef = useRef(null);

    useEffect(() => {
        const removeStart = router.on('start', () => {
            // Only show overlay after 200ms to avoid flash for fast navigations
            delayRef.current = window.setTimeout(() => {
                setVisible(true);
                // Allow a frame for the element to mount, then animate in
                requestAnimationFrame(() => setShow(true));
            }, 200);
        });

        const hide = () => {
            if (delayRef.current) {
                window.clearTimeout(delayRef.current);
                delayRef.current = null;
            }
            setShow(false);
            // Wait for fade-out animation before unmounting
            window.setTimeout(() => setVisible(false), 150);
        };

        const removeFinish = router.on('finish', hide);
        const removeError = router.on('error', hide);
        const removeInvalid = router.on('invalid', hide);

        return () => {
            removeStart?.();
            removeFinish?.();
            removeError?.();
            removeInvalid?.();
            if (delayRef.current) window.clearTimeout(delayRef.current);
        };
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm transition-opacity duration-150 ${show ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/95 px-8 py-7 text-center shadow-2xl transition-all duration-200 dark:bg-slate-900/95 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" style={{ animationDuration: '0.8s' }} />
                    <div className="text-lg font-black text-slate-900 dark:text-white">شحنلي</div>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">جارٍ تحميل الصفحة...</div>
            </div>
        </div>
    );
}

import { Link } from '@inertiajs/react';
import { ArrowUpRight, Gift, Sparkles } from 'lucide-react';

function isGiftSection(section) {
    return String(section?.name || '').toLowerCase().includes('gift') || String(section?.description || '').includes('بطاقات رصيد');
}

function hasUsefulImage(value) {
    const src = String(value || '').trim();
    if (!src) return false;
    if (src === '#') return false;
    return true;
}

export default function StoreSectionCard({ section, href }) {
    const gift = isGiftSection(section);
    const image = hasUsefulImage(section.background) ? section.background : (hasUsefulImage(section.icon) ? section.icon : null);

    return (
        <Link
            href={href}
            className={`group block overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_34px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(14,165,233,0.16)] dark:bg-slate-900 ${gift ? 'border-sky-200 dark:border-sky-900/70' : 'border-slate-200 hover:border-sky-200 dark:border-slate-800'}`}
        >
            <div className={`relative h-32 overflow-hidden sm:h-36 ${gift ? 'bg-gradient-to-br from-sky-900 via-blue-950 to-violet-950' : 'bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.20),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(139,92,246,0.18),transparent_34%)]" />

                {gift && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
                        <Sparkles className="h-3 w-3" />
                        Sh7nle
                    </div>
                )}

                <div className="relative flex h-full w-full items-center justify-center p-5">
                    {image ? (
                        <img
                            src={image}
                            alt={section.name}
                            loading="lazy"
                            className={`max-h-24 max-w-[78%] object-contain drop-shadow-sm transition duration-500 group-hover:scale-105 sm:max-h-28 ${gift ? 'opacity-95' : ''}`}
                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className={`flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-sm ${gift ? 'bg-white/10 text-white' : 'bg-white text-sky-700 dark:bg-slate-900 dark:text-sky-300'}`}>
                            {gift ? '🎁' : '🎮'}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 text-right sm:p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-slate-950 dark:text-white sm:text-base">{section.name}</h3>
                        {gift && <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">اشترِ بطاقة رصيد واستخدمها أو أرسلها لأي شخص.</p>}
                    </div>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${gift ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {gift ? <Gift className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                </div>
            </div>
        </Link>
    );
}

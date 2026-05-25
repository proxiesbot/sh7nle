import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Clock3, Gift, Info, Sparkles, Trophy, Wallet, Zap } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { useSitePreferences } from '@/lib/sitePreferences';

const wheelColors = [
    '#0F7DFF',
    '#4F6CFF',
    '#6A5CFF',
    '#7C3AED',
    '#A855F7',
    '#8B5CF6',
    '#0EA5E9',
    '#06B6D4',
    '#2563EB',
    '#7E22CE',
];

function polarToCartesian(cx, cy, r, angle) {
    const radians = (angle - 90) * Math.PI / 180;
    return {
        x: cx + r * Math.cos(radians),
        y: cy + r * Math.sin(radians),
    };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ');
}

function cleanNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return '0';
    return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function cleanPrizeText(text = '') {
    return String(text || '')
        .replace(/(\d+)\.0+\s*\$/g, '$1$')
        .replace(/(\d+\.\d*[1-9])0+\s*\$/g, '$1$')
        .replace(/\s+/g, ' ')
        .trim();
}

function displayPrizeName(prize = {}) {
    const type = String(prize?.type || '').toLowerCase();
    const value = cleanNumber(prize?.value);

    if (type === 'balance') return `${value}$ رصيد`;
    if (type === 'discount_percent') return `خصم ${value}%`;
    if (type === 'gift_card') return Number(prize?.value || 0) > 0 ? `Gift Card ${value}$` : 'Gift Card';

    return cleanPrizeText(prize?.name || '');
}

function fitText(lines) {
    const longest = Math.max(...lines.map((line) => String(line || '').length), 0);
    if (longest <= 5) return { size: 27, lineGap: 25 };
    if (longest <= 8) return { size: 22, lineGap: 23 };
    if (longest <= 12) return { size: 18, lineGap: 22 };
    return { size: 15, lineGap: 20 };
}

function formatPrize(prize = {}, isArabic = true) {
    const raw = displayPrizeName(prize);
    const type = String(prize?.type || '').toLowerCase();
    const value = cleanNumber(prize?.value);
    const lowered = raw.toLowerCase();

    if (type === 'balance') return [`${value}$`, isArabic ? 'رصيد' : 'Balance'];
    if (type === 'discount_percent') return [`${value}%`, isArabic ? 'خصم' : 'Discount'];
    if (type === 'gift_card') return isArabic ? ['بطاقة', 'هدية'] : ['Gift', 'Card'];

    if (raw.includes('حظ')) return ['حظ', 'أوفر'];
    if (lowered.includes('gift')) return isArabic ? ['بطاقة', 'هدية'] : ['Gift', 'Card'];

    if (raw.includes('بدون') || raw.includes('جائزة')) return ['بدون جائزة', isArabic ? 'هذه المرة' : 'This time'];
    if (raw.includes('جرب') || raw.includes('جرّب') || raw.includes('مرة أخرى')) return [isArabic ? 'جرّب مرة' : 'Try again', isArabic ? 'أخرى لاحقًا' : 'later'];

    const balance = raw.match(/(\d+(?:\.\d+)?)\s*\$/);
    if (balance) return [`${cleanNumber(balance[1])}$`, isArabic ? 'رصيد' : 'Balance'];

    const discount = raw.match(/(\d+(?:\.\d+)?)\s*%/);
    if (discount) return [`${cleanNumber(discount[1])}%`, isArabic ? 'خصم' : 'Discount'];

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length <= 2) return words;

    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
}

export default function Index({ spins = 0, prizes = [], expiresAt = null, howToEarn = [] }) {
    const { isArabic } = useSitePreferences();
    const [available, setAvailable] = useState(spins);
    const [message, setMessage] = useState('');
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState(null);

    const logoPath = '/images/brand/sh7nle-icon-192.png';

    const segments = useMemo(() => {
        const visible = prizes.length ? prizes : [
            { id: 1, name: 'حظ أوفر' },
            { id: 2, name: 'رصيد 1$' },
            { id: 3, name: 'خصم 5%' },
            { id: 4, name: 'Gift Card' },
            { id: 5, name: 'حظ أوفر' },
            { id: 6, name: 'رصيد 5$' },
        ];

        const angle = 360 / visible.length;
        return visible.map((prize, index) => ({
            prize,
            start: index * angle,
            end: (index + 1) * angle,
            mid: index * angle + angle / 2,
            color: wheelColors[index % wheelColors.length],
        }));
    }, [prizes]);

    const guideItems = howToEarn?.length ? howToEarn : [
        isArabic ? 'إيداع 10$ أو أكثر يمنحك لفة بعد اعتماد العملية.' : 'A $10+ approved deposit gives you a spin.',
        isArabic ? '3 إحالات مؤهلة تمنحك لفة إضافية.' : '3 qualified referrals give an extra spin.',
        isArabic ? 'استخدم اللفات المتاحة قبل انتهاء صلاحيتها.' : 'Use your available spins before they expire.',
    ];

    const spin = async () => {
        if (spinning || available <= 0) return;

        setSpinning(true);
        setMessage('');
        setWinner(null);

        try {
            const res = await window.axios.post(route('wheel.spin'));
            const prize = res.data.prize;
            let index = segments.findIndex((segment) => Number(segment.prize.id) === Number(prize?.id));

            if (index < 0) {
                const prizeLabel = displayPrizeName(prize);
                index = segments.findIndex((segment) => displayPrizeName(segment.prize) === prizeLabel);
            }

            if (index < 0) index = 0;

            const segmentAngle = 360 / Math.max(1, segments.length);
            const targetMiddle = index * segmentAngle + segmentAngle / 2;
            const currentAngle = ((rotation % 360) + 360) % 360;
            const desiredAngle = (360 - targetMiddle + 360) % 360;
            const adjustment = (desiredAngle - currentAngle + 360) % 360;
            const finalRotation = rotation + 8 * 360 + adjustment;

            setRotation(finalRotation);
            window.setTimeout(() => {
                setMessage(res.data.message);
                setWinner(prize);
                setAvailable(res.data.spins);
                setSpinning(false);
            }, 4300);
        } catch (e) {
            setMessage(e.response?.data?.message || (isArabic ? 'تعذر تشغيل العجلة الآن. حاول لاحقًا.' : 'Could not spin now. Please try again later.'));
            setSpinning(false);
        }
    };

    return (
        <PublicLayout>
            <Head title={isArabic ? 'عجلة الفرصة' : 'Chance Wheel'} />

            <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_30px_120px_rgba(15,23,42,0.22)] dark:border-slate-800 sm:p-6 lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(14,165,233,0.25),transparent_24%),radial-gradient(circle_at_86%_16%,rgba(124,58,237,0.28),transparent_28%),linear-gradient(135deg,#040816,#0b1230_48%,#0f172a)]" />
                <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

                <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_470px] xl:items-center">
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sm font-black text-sky-100">
                                <Trophy className="h-4 w-4" />
                                {isArabic ? `لفاتك المتاحة: ${available}` : `Available spins: ${available}`}
                            </div>
                            {expiresAt && (
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-100">
                                    <Clock3 className="h-4 w-4" />
                                    {isArabic ? 'أقرب انتهاء:' : 'Next expiry:'} {new Date(expiresAt).toLocaleString()}
                                </div>
                            )}
                        </div>

                        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                            {isArabic ? 'عجلة الفرصة' : 'Chance Wheel'}
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-200 sm:text-base">
                            {isArabic
                                ? 'استخدم لفاتك المتاحة واربح رصيدًا أو خصومات أو بطاقات هدية. كل نتيجة تُضاف تلقائيًا إلى حسابك.'
                                : 'Use your available spins to win balance, discounts, or gift cards. Every result is added to your account automatically.'}
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                                <Wallet className="mb-3 h-6 w-6 text-cyan-300" />
                                <div className="font-black text-white">{isArabic ? 'إيداع مؤهل' : 'Qualified deposit'}</div>
                                <div className="mt-2 text-xs leading-6 text-slate-300">{isArabic ? 'إيداع 10$ أو أكثر يمنحك لفة.' : 'Deposit $10+ to earn a spin.'}</div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                                <Sparkles className="mb-3 h-6 w-6 text-violet-300" />
                                <div className="font-black text-white">{isArabic ? 'إحالات مؤهلة' : 'Qualified referrals'}</div>
                                <div className="mt-2 text-xs leading-6 text-slate-300">{isArabic ? '3 إحالات مؤهلة تمنحك لفة.' : '3 qualified referrals earn a spin.'}</div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                                <Zap className="mb-3 h-6 w-6 text-sky-300" />
                                <div className="font-black text-white">{isArabic ? 'نتيجة فورية' : 'Instant result'}</div>
                                <div className="mt-2 text-xs leading-6 text-slate-300">{isArabic ? 'النتيجة تظهر مباشرة بعد توقف العجلة.' : 'The result appears when the wheel stops.'}</div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[28px] border border-sky-300/20 bg-sky-400/10 p-4 text-sm leading-7 text-sky-50">
                            <div className="mb-3 flex items-center gap-2 font-black">
                                <Info className="h-5 w-5" />
                                {isArabic ? 'كيف تحصل على لفات؟' : 'How to earn spins'}
                            </div>
                            <ul className="space-y-2">
                                {guideItems.map((item, index) => <li key={index}>• {item}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-[470px]">
                        <div className="relative mx-auto aspect-square w-full max-w-[450px] rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 p-3 shadow-[0_30px_80px_rgba(59,130,246,0.28)]">
                            <div className="absolute left-1/2 top-[-8px] z-20 -translate-x-1/2 drop-shadow-2xl">
                                <div className="h-0 w-0 border-l-[21px] border-r-[21px] border-t-[42px] border-l-transparent border-r-transparent border-t-white" />
                            </div>

                            <div className="h-full w-full overflow-hidden rounded-full border-[9px] border-white/90 bg-slate-950 shadow-[inset_0_0_0_8px_rgba(15,23,42,0.9)]">
                                <div className="h-full w-full transition-transform duration-[4300ms] ease-out" style={{ transform: `rotate(${rotation}deg)` }}>
                                    <svg viewBox="0 0 500 500" className="h-full w-full">
                                        <defs>
                                            <filter id="labelShadow" x="-30%" y="-30%" width="160%" height="160%">
                                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#020617" floodOpacity="0.75" />
                                            </filter>
                                            <radialGradient id="centerGlow" cx="50%" cy="45%" r="65%">
                                                <stop offset="0%" stopColor="#162247" />
                                                <stop offset="100%" stopColor="#091224" />
                                            </radialGradient>
                                        </defs>
                                        {segments.map((segment) => {
                                            const lines = formatPrize(segment.prize, isArabic);
                                            const label = polarToCartesian(250, 250, 158, segment.mid);
                                            const { size, lineGap } = fitText(lines);
                                            return (
                                                <g key={segment.prize.id || segment.prize.name}>
                                                    <path d={describeArc(250, 250, 232, segment.start, segment.end)} fill={segment.color} stroke="rgba(255,255,255,0.92)" strokeWidth="4" />
                                                    <path d={describeArc(250, 250, 232, segment.start, segment.end)} fill="rgba(255,255,255,0.08)" />
                                                    <text
                                                        x={label.x}
                                                        y={label.y - ((lines.length - 1) * lineGap) / 2}
                                                        fill="white"
                                                        fontSize={size}
                                                        fontWeight="900"
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        filter="url(#labelShadow)"
                                                        style={{ paintOrder: 'stroke', stroke: 'rgba(2,6,23,0.78)', strokeWidth: 5, strokeLinejoin: 'round' }}
                                                    >
                                                        {lines.map((line, index) => (
                                                            <tspan key={index} x={label.x} dy={index === 0 ? 0 : lineGap}>{line}</tspan>
                                                        ))}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                        <circle cx="250" cy="250" r="96" fill="white" opacity="0.98" />
                                        <circle cx="250" cy="250" r="82" fill="url(#centerGlow)" stroke="#38bdf8" strokeWidth="4" />
                                        <circle cx="250" cy="250" r="48" fill="#0b1225" stroke="#ffffff" strokeWidth="2" />
                                        <image href={logoPath} x="214" y="214" width="72" height="72" preserveAspectRatio="xMidYMid meet" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.06] p-4 text-right backdrop-blur-xl">
                            <Button
                                onClick={spin}
                                disabled={spinning || available <= 0}
                                className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-blue-500/25 hover:from-sky-400 hover:to-violet-500"
                            >
                                {spinning ? (isArabic ? 'العجلة تدور...' : 'Spinning...') : available > 0 ? (isArabic ? 'لف العجلة الآن' : 'Spin now') : (isArabic ? 'لا توجد لفات متاحة' : 'No spins available')}
                            </Button>

                            {winner && (
                                <div className="mt-4 rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-sm font-black text-sky-50">
                                    <Gift className="ml-2 inline h-4 w-4" />
                                    {isArabic ? 'النتيجة:' : 'Result:'} {displayPrizeName(winner)}
                                </div>
                            )}

                            {message && <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-bold text-slate-100">{message}</div>}
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

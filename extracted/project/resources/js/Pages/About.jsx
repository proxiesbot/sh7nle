import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, CreditCard, ShieldCheck, Wallet, Zap } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button } from '@/components/ui/button';

export default function About() {
    const features = [
        {
            icon: Zap,
            title: 'تنفيذ سريع',
            body: 'تصميم الواجهة صار أوضح لعمليات الشراء الفوري والخدمات المرتبطة بمزود خارجي.',
        },
        {
            icon: Wallet,
            title: 'إدارة الرصيد',
            body: 'إيداعات وشراء ومتابعة ضمن صفحات أكثر ترتيبًا للمستخدم النهائي.',
        },
        {
            icon: CreditCard,
            title: 'خدمات رقمية',
            body: 'عرض بطاقات ومنتجات بأسلوب قريب من متاجر الشحن والخدمات المعروفة.',
        },
    ];

    return (
        <PublicLayout>
            <Head title="من نحن" />

            <section className="overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.4)] lg:p-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200">
                            <BadgeCheck className="h-4 w-4" />
                            واجهة جديدة مستلهمة من متاجر الخدمات الرقمية
                        </div>
                        <h1 className="text-4xl font-black text-white">عن Hi Card</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300">
                            الهدف من النسخة الجديدة هو جعل المتجر أقرب بصريًا لواجهات المتاجر العربية للخدمات الرقمية، مع الحفاظ على هويتك الخاصة وعدم استنساخ أي موقع بشكل حرفي.
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-300">
                            تم التركيز على البطاقات الكبيرة، شريط البحث، إبراز الأقسام، وتجهيز تجربة شراء تعتمد على بيانات المنتجات المرتبطة بمزود API عند توفرها.
                        </p>
                    </div>
                    <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-fuchsia-500/15 p-5 text-right">
                        <div className="mb-3 flex justify-end text-cyan-300"><ShieldCheck className="h-5 w-5" /></div>
                        <div className="text-2xl font-black text-white">ما الذي تغيّر؟</div>
                        <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
                            <li>• تصميم RTL حديث ومناسب للموبايل.</li>
                            <li>• صفحات أقسام ومنتجات أوضح وأسهل للتصفح.</li>
                            <li>• نمط بصري يلمّح لتكامل الخدمات عبر API.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-3">
                {features.map(({ icon: Icon, title, body }) => (
                    <div key={title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 text-right">
                        <div className="mb-4 flex justify-end text-cyan-300"><Icon className="h-6 w-6" /></div>
                        <h3 className="text-xl font-black text-white">{title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 rounded-[34px] border border-white/10 bg-white/[0.03] p-6 text-right lg:p-8">
                <h2 className="text-2xl font-black text-white">جاهز للتجربة؟</h2>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-300">
                    ادخل إلى المتجر، راجع الأقسام والمنتجات، وجرّب تدفق الشراء من الرصيد أو الإيداع لإكمال التجربة محليًا قبل الرفع للسيرفر.
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <Link href={route('sections.main')}>
                        <Button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 font-bold text-white hover:from-cyan-400 hover:to-fuchsia-400">الذهاب للرئيسية</Button>
                    </Link>
                    <Link href={route('login')}>
                        <Button variant="outline" className="rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">تسجيل الدخول</Button>
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BuyCardModal from '@/components/BuyCardModal';
import PublicLayout from '@/Layouts/PublicLayout';
import StoreProductCard from '@/components/store/StoreProductCard';

export default function Index({ category = null, subcategory = null, cards = [] }) {
    const { auth } = usePage().props;
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCards = useMemo(
        () => cards.filter((card) => `${card.name} ${card.description || ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase())),
        [cards, searchQuery],
    );

    return (
        <PublicLayout>
            <Head title={subcategory?.name || 'البطاقات'} />

            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.4)]">
                <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
                    <div className="text-right">
                        <div className="mb-4 flex flex-wrap justify-end gap-2 text-xs text-slate-300">
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">المنتجات</span>
                            {category && <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">{category.name}</span>}
                            {subcategory && <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1.5 text-fuchsia-200">{subcategory.name}</span>}
                        </div>
                        <h1 className="text-3xl font-black text-white sm:text-4xl">{subcategory?.name || 'كل البطاقات'}</h1>
                        
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 text-right">
                        <div className="text-xs text-slate-400">عدد المنتجات</div>
                        <div className="mt-1 text-3xl font-black text-white">{cards.length}</div>
                        
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex justify-end">
                        <Link
                            href={category ? route('category.getSubcategories', category.id) : route('sections.main')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.07]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            رجوع
                        </Link>
                    </div>

                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="ابحث ضمن المنتجات..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="h-12 rounded-2xl border-white/10 bg-slate-950/60 pr-11 text-right text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>
            </section>

            {filteredCards.length > 0 ? (
                <section className="mt-8">
                    <div className="mb-5 text-right">
                        <h2 className="text-2xl font-black text-white">المنتجات</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredCards.map((card) => (
                            <StoreProductCard key={card.id} card={card} onBuy={setSelectedCard} />
                        ))}
                    </div>
                </section>
            ) : (
                <section className="mt-8 rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-3xl">🧩</div>
                    <h3 className="text-2xl font-black text-white">لا توجد منتجات مطابقة</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">جرّب عبارة بحث مختلفة أو ارجع إلى القسم السابق لاختيار خدمة أخرى.</p>
                </section>
            )}

            {selectedCard && auth.user && <BuyCardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
        </PublicLayout>
    );
}

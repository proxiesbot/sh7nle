import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, PackagePlus, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BuyCardModal from '@/components/BuyCardModal';
import PublicLayout from '@/Layouts/PublicLayout';
import StoreSectionCard from '@/components/store/StoreSectionCard';
import StoreProductCard from '@/components/store/StoreProductCard';
import { useSitePreferences } from '@/lib/sitePreferences';
import EditableText from '@/components/EditableText';

export default function Index({ sections = [], cards = [], parentSection = null }) {
    const { auth, activeBanner, activeBanners = [], siteSettings = {}, isAdmin: sharedIsAdmin = false, isSuperAdmin = false } = usePage().props;
    const { t, isArabic } = useSitePreferences();
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [bannerIndex, setBannerIndex] = useState(0);

    const roleNames = useMemo(
        () => [auth.user?.role?.name, ...(auth.user?.roles || []).map((role) => role.name), ...(auth.user?.role_names || [])].filter(Boolean),
        [auth.user],
    );
    const normalizeRole = (role) => String(role || '').toLowerCase().replace(/[\s_-]/g, '');
    const adminEmail = String(auth.user?.email || '').toLowerCase();
    const isAdmin = Boolean(auth.user && (sharedIsAdmin || isSuperAdmin || roleNames.some((role) => ['superadmin', 'admin', 'administrator', 'superadministrator'].includes(normalizeRole(role))) || auth.user?.is_admin || auth.user?.is_super_admin || adminEmail.includes('admin')));

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredSections = useMemo(
        () => sections?.filter((section) => `${section.name} ${section.description || ''}`.toLowerCase().includes(normalizedSearch)),
        [sections, normalizedSearch],
    );
    const filteredCards = useMemo(
        () => cards?.filter((card) => `${card.name} ${card.description || ''}`.toLowerCase().includes(normalizedSearch)),
        [cards, normalizedSearch],
    );

    const isMainPage = !parentSection;
    const shouldShowCards = !isMainPage && (filteredCards?.length || 0) > 0;
    const banners = activeBanners?.length ? activeBanners : (activeBanner ? [activeBanner] : []);

    useEffect(() => {
        if (!isMainPage || banners.length <= 1) return;
        const seconds = Math.max(2, Number(siteSettings?.banners?.autoplaySeconds || 5));
        const timer = window.setInterval(() => setBannerIndex((current) => (current + 1) % banners.length), seconds * 1000);
        return () => window.clearInterval(timer);
    }, [isMainPage, banners.length, siteSettings?.banners?.autoplaySeconds]);

    const currentBanner = banners[bannerIndex] || banners[0] || null;

    return (
        <PublicLayout>
            <Head title={parentSection?.name || t.home} />

            {isMainPage && (
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
                    {currentBanner?.image ? (
                        currentBanner.link ? (
                            <a href={currentBanner.link} target="_blank" rel="noreferrer" className="block">
                                <img src={currentBanner.image} alt={t.bannerAlt} className="aspect-[16/9] w-full object-cover object-center sm:aspect-[16/6]" />
                            </a>
                        ) : (
                            <img src={currentBanner.image} alt={t.bannerAlt} className="aspect-[16/9] w-full object-cover object-center sm:aspect-[16/6]" />
                        )
                    ) : (
                        <div className="flex aspect-[16/9] w-full items-center justify-center sm:aspect-[16/6] bg-gradient-to-r from-sky-100 via-cyan-50 to-violet-100 text-sm font-semibold text-slate-500 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 dark:text-slate-400">
                            {t.bannerAlt}
                        </div>
                    )}
                    {banners.length > 1 && (
                        <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                            {banners.map((banner, index) => (
                                <button key={banner.id || index} type="button" onClick={() => setBannerIndex(index)} className={`h-2.5 rounded-full transition-all ${bannerIndex === index ? 'w-8 bg-sky-500' : 'w-2.5 bg-slate-300 dark:bg-slate-700'}`} aria-label={`banner-${index + 1}`} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white px-4 py-5 sm:mt-6 sm:px-8 sm:py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:px-8">
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                        {isMainPage ? t.sections : parentSection.name}
                    </h1>
                    
                </div>

                {isAdmin && (
                    <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3">
                        {isMainPage ? (
                            <>
                                <Link href={route('sections.create')}><Button className="rounded-2xl"><Plus className="ml-2 h-4 w-4" />إضافة قسم رئيسي</Button></Link>
                                <Link href={route('importedProducts.index', { root: 1 })}><Button variant="outline" className="rounded-2xl"><PackagePlus className="ml-2 h-4 w-4" />فتح مركز الاستيراد</Button></Link>
                            </>
                        ) : (
                            <>
                                <Link href={route('sections.subSection.create', parentSection.id)}><Button className="rounded-2xl"><Plus className="ml-2 h-4 w-4" />إضافة قسم فرعي</Button></Link>
                                <Link href={route('sections.card.create', parentSection.id)}><Button variant="outline" className="rounded-2xl">إضافة منتج يدوي</Button></Link>
                                <Link href={route('importedProducts.index', { sectionId: parentSection.id })}><Button variant="outline" className="rounded-2xl"><PackagePlus className="ml-2 h-4 w-4" />فتح مركز الاستيراد</Button></Link>
                            </>
                        )}
                    </div>
                )}

                <div className="relative mt-5">
                    <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isArabic ? 'right-4' : 'left-4'}`} />
                    <Input
                        type="text"
                        placeholder={t.searchSections}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className={`h-14 rounded-[24px] border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${isArabic ? 'pr-11 text-right' : 'pl-11 text-left'}`}
                    />
                </div>
            </section>

            {parentSection && (
                <div className="mt-5 grid gap-2 sm:flex sm:justify-end sm:gap-3">
                    {isAdmin && <Link href={route('sections.manage', parentSection.id)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">إدارة هذا القسم</Link>}
                    <Link
                        href={route('sections.main')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" /> {t.backToStore}
                    </Link>
                </div>
            )}

            {filteredSections?.length > 0 && (
                <section className="mt-8">
                    <div className="mb-5 text-right">
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                            {isMainPage ? t.mainSections : t.availableCategories}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
                        {filteredSections.map((section) => (
                            <StoreSectionCard key={section.id} section={section} href={route('sections.show', section.id)} />
                        ))}
                    </div>
                </section>
            )}

            {shouldShowCards && filteredCards?.length > 0 && (
                <section className="mt-10">
                    <div className="mb-5 text-right">
                        <h2 className="text-2xl font-black text-slate-950 dark:text-white">{t.products}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
                        {filteredCards.map((card) => (
                            <StoreProductCard key={card.id} card={card} onBuy={setSelectedCard} compact />
                        ))}
                    </div>
                </section>
            )}

            {!filteredSections?.length && !filteredCards?.length && (
                <section className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-3xl dark:border-slate-700 dark:bg-slate-800">🔎</div>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">{t.noResults}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{t.noResultsHint}</p>
                </section>
            )}

            {selectedCard && auth.user && <BuyCardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
        </PublicLayout>
    );
}

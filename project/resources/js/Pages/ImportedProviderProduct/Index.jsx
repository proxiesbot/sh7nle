import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, ChevronLeft, Download, FolderTree, PackagePlus, Search } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatNumberPrecise } from '@/lib/formatters';

function money(value) {
    return formatNumberPrecise(value);
}

export default function Index({ products, providerSources = [], importSections = [], filters = {}, targetSection = null, remoteCatalog = null }) {
    const [importJob, setImportJob] = useState(null);
    const [allImportJob, setAllImportJob] = useState(null);
    const [scanJob, setScanJob] = useState(null);
    const [selectedRemoteProducts, setSelectedRemoteProducts] = useState([]);
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkImportMessage, setBulkImportMessage] = useState('');
    const pollTimerRef = useRef(null);
    const allPollTimerRef = useRef(null);
    const scanPollTimerRef = useRef(null);
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        providerSourceId: filters.providerSourceId || '',
        sectionId: filters.sectionId || '',
        root: filters.root ? 1 : 0,
        remoteParentId: filters.remoteParentId || 0,
        trail: filters.trail || [],
        parentStack: filters.parentStack || [],
    });

    const showRemoteProducts = (remoteCatalog?.products?.length || 0) > 0;
    const browsingRemoteCatalog = Boolean(data.providerSourceId);
    const visibleCategories = (remoteCatalog?.categories || []);
    const visibleProducts = (remoteCatalog?.products || []);
    const categoriesWereTrimmed = false;
    const productsWereTrimmed = false;
    const isSwGamesCatalog = remoteCatalog?.provider?.driver === 'swgames' || remoteCatalog?.provider?.slug === 'sw-games';
    const isSwGamesRoot = isSwGamesCatalog && Number(remoteCatalog?.currentParentId || 0) === 0;
    const scanRunning = scanJob?.status === 'running';
    const scanCompleted = scanJob?.status === 'completed';
    const scanCanImport = Boolean(scanJob?.progress?.canImport || (scanCompleted && (scanJob?.progress?.discoveredProducts || 0) > 0));
    const targetSectionName = targetSection?.name || 'القسم المختار';


    useEffect(() => {
        return () => {
            if (pollTimerRef.current) {
                window.clearTimeout(pollTimerRef.current);
            }
            if (allPollTimerRef.current) {
                window.clearTimeout(allPollTimerRef.current);
            }
            if (scanPollTimerRef.current) {
                window.clearTimeout(scanPollTimerRef.current);
            }
        };
    }, []);

    const getCsrfToken = () => {
        if (typeof document === 'undefined') {
            return null;
        }

        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    const jsonRequest = async (url, payload = {}, method = 'POST') => {
        const csrfToken = getCsrfToken();

        let response;
        try {
            response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: method === 'GET' ? undefined : JSON.stringify(payload),
                credentials: 'same-origin',
                mode: 'same-origin',
                referrerPolicy: 'same-origin',
            });
        } catch (networkError) {
            throw new Error('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
        }

        if (response.status === 419) {
            throw new Error('انتهت الجلسة أو رمز الحماية غير صالح. حدّث الصفحة وسجّل الدخول من جديد.');
        }

        const contentType = response.headers.get('content-type') || '';
        const body = contentType.includes('application/json') ? await response.json() : {};

        if (!response.ok) {
            throw new Error(body.message || 'تعذر تنفيذ العملية المطلوبة.');
        }

        return body;
    };

    const scheduleNextImportStep = (jobId) => {
        if (pollTimerRef.current) {
            window.clearTimeout(pollTimerRef.current);
        }

        pollTimerRef.current = window.setTimeout(async () => {
            try {
                const response = await jsonRequest(route('importedProducts.importRemoteCategory.process'), {
                    jobId,
                });
                setImportJob(response);

                if (response.status === 'running') {
                    scheduleNextImportStep(jobId);
                    return;
                }

                router.reload({ only: ['products', 'remoteCatalog'] });
            } catch (error) {
                setImportJob((current) => current ? {
                    ...current,
                    status: 'failed',
                    progress: {
                        ...(current.progress || {}),
                        error: error.message,
                        lastMessage: error.message,
                    },
                } : null);
            }
        }, 650);
    };

    const scheduleNextAllImportStep = (jobId) => {
        if (allPollTimerRef.current) {
            window.clearTimeout(allPollTimerRef.current);
        }

        allPollTimerRef.current = window.setTimeout(async () => {
            try {
                const response = await jsonRequest(route('importedProducts.importAll.process'), {
                    jobId,
                });
                setAllImportJob(response);

                if (response.status === 'running') {
                    scheduleNextAllImportStep(jobId);
                    return;
                }

                router.reload({ only: ['products', 'remoteCatalog'] });
            } catch (error) {
                setAllImportJob((current) => current ? {
                    ...current,
                    status: 'failed',
                    progress: {
                        ...(current.progress || {}),
                        error: error.message,
                        lastMessage: error.message,
                    },
                } : null);
            }
        }, 750);
    };

    const scheduleNextScanStep = (jobId) => {
        if (scanPollTimerRef.current) {
            window.clearTimeout(scanPollTimerRef.current);
        }

        scanPollTimerRef.current = window.setTimeout(async () => {
            try {
                const response = await jsonRequest(route('importedProducts.scanCategory.process'), {
                    jobId,
                });
                setScanJob(response);

                if (response.status === 'running') {
                    const delay = response.stage === 'provider_rate_limited' ? 15000 : 700;
                    scanPollTimerRef.current = window.setTimeout(() => scheduleNextScanStep(jobId), delay);
                    return;
                }
            } catch (error) {
                setScanJob((current) => current ? {
                    ...current,
                    status: 'failed',
                    progress: {
                        ...(current.progress || {}),
                        error: error.message,
                        lastMessage: error.message,
                    },
                } : null);
            }
        }, 700);
    };

    const startCategoryScan = async () => {
        if (!data.providerSourceId) {
            window.alert('اختر مزودًا أولًا.');
            return;
        }

        if (scanJob?.status === 'running') {
            return;
        }

        try {
            const response = await jsonRequest(route('importedProducts.scanCategory.start'), {
                providerSourceId: data.providerSourceId,
                remoteParentId: remoteCatalog?.currentParentId || 0,
                trail: remoteCatalog?.trail || [],
            });
            setScanJob(response);
            scheduleNextScanStep(response.jobId);
        } catch (error) {
            window.alert(error.message || 'تعذر بدء فحص القسم.');
        }
    };

    const startAllProvidersImport = async () => {
        if (allImportJob?.status === 'running') {
            return;
        }

        const confirmed = window.confirm('سيبدأ استيراد كل منتجات كل المزودات الفعالة في الخلفية. قد تستغرق العملية عدة دقائق. هل تريد المتابعة؟');
        if (!confirmed) {
            return;
        }

        try {
            const response = await jsonRequest(route('importedProducts.importAll.start'), {
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root),
            });

            setAllImportJob(response);
            scheduleNextAllImportStep(response.jobId);
        } catch (error) {
            window.alert(error.message || 'تعذر بدء الاستيراد الشامل.');
        }
    };


    const contextLabel = useMemo(() => {
        if (targetSection) {
            return `سيتم استيراد المنتجات إلى القسم الذي اخترته: ${targetSection.name}`;
        }

        if (filters.root) {
            return 'سيتم الإضافة مباشرة إلى الصفحة الرئيسية للمتجر';
        }

        return 'اختر القسم الهدف للاستيراد، ثم اختر المزود والقسم القادم من المزود.';
    }, [targetSection, filters.root]);

    const submitFilters = (event) => {
        event.preventDefault();
        get(route('importedProducts.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openCatalogLevel = (parentId = 0, trail = [], parentStack = []) => {
        setSelectedRemoteProducts([]);
        setBulkImportMessage('');
        if (!data.providerSourceId) {
            window.alert('اختر مزودًا أولًا.');
            return;
        }

        router.get(
            route('importedProducts.index'),
            {
                search: data.search || '',
                providerSourceId: data.providerSourceId,
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root) ? 1 : 0,
                remoteParentId: parentId,
                trail,
                parentStack,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['products', 'remoteCatalog'],
            }
        );
    };


    const goBackOneLevel = () => {
        if (!remoteCatalog) {
            openCatalogLevel(0, [], []);
            return;
        }

        const currentStack = Array.isArray(remoteCatalog.parentStack) ? remoteCatalog.parentStack : [];
        if (!currentStack.length) {
            openCatalogLevel(0, [], []);
            return;
        }

        const previousStack = currentStack.slice(0, -1);
        const previousParentId = previousStack.length ? previousStack[previousStack.length - 1] : 0;
        const previousTrail = (remoteCatalog.trail || []).slice(0, -1);

        openCatalogLevel(previousParentId, previousTrail, previousStack);
    };

    const importProduct = (productId) => {
        router.post(
            route('importedProducts.importRemote'),
            {
                providerSourceId: data.providerSourceId,
                productId,
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root),
                remoteParentId: remoteCatalog?.currentParentId || 0,
                trail: remoteCatalog?.trail || [],
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['products', 'remoteCatalog', 'flash', 'errors'],
            }
        );
    };

    const importCategory = async () => {
        if (!data.providerSourceId) {
            window.alert('اختر مزودًا أولًا.');
            return;
        }

        if (importJob?.status === 'running') {
            return;
        }

        try {
            const response = await jsonRequest(route('importedProducts.importRemoteCategory.start'), {
                providerSourceId: data.providerSourceId,
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root),
                remoteParentId: remoteCatalog?.currentParentId || 0,
                trail: remoteCatalog?.trail || [],
            });
            setImportJob(response);
            scheduleNextImportStep(response.jobId);
        } catch (error) {
            window.alert(error.message || 'تعذر بدء الاستيراد التدريجي.');
        }
    };


    const toggleSelectedRemoteProduct = (productId) => {
        const id = String(productId);
        setSelectedRemoteProducts((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const selectAllVisibleProducts = () => {
        setSelectedRemoteProducts(visibleProducts.map((product) => String(product.id)));
    };

    const clearSelectedRemoteProducts = () => {
        setSelectedRemoteProducts([]);
        setBulkImportMessage('');
    };

    const importSelectedProducts = async () => {
        if (!selectedRemoteProducts.length) {
            window.alert('حدد منتجًا واحدًا على الأقل.');
            return;
        }

        if (!data.sectionId && !data.root) {
            const confirmed = window.confirm('لم تختر قسمًا هدفًا. سيتم الاستيراد تلقائيًا حسب أقسام المزود. هل تريد المتابعة؟');
            if (!confirmed) return;
        }

        setBulkImporting(true);
        setBulkImportMessage('');

        try {
            const response = await jsonRequest(route('importedProducts.importSelected'), {
                providerSourceId: data.providerSourceId,
                productIds: selectedRemoteProducts,
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root),
                remoteParentId: remoteCatalog?.currentParentId || 0,
                trail: remoteCatalog?.trail || [],
            });

            setBulkImportMessage(response.message || 'تم استيراد المنتجات المحددة.');
            setSelectedRemoteProducts([]);
            router.reload({ only: ['products', 'remoteCatalog'] });
        } catch (error) {
            setBulkImportMessage(error.message || 'تعذر استيراد المنتجات المحددة.');
        } finally {
            setBulkImporting(false);
        }
    };

    return (
        <AdminLayout title="مركز الاستيراد والمزامنة">
            <Head title="مركز الاستيراد">
                <meta name="description" content="استيراد ومزامنة منتجات المزود بشكل تدريجي." />
            </Head>

            <div className="space-y-6 text-right">
                <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                <Boxes className="h-4 w-4" />
                                {contextLabel}
                            </div>
                            <h1 className="text-2xl font-black text-slate-950 dark:text-white">مركز الاستيراد والمزامنة</h1>
                            <p className="max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                                بدل جلب كل كتالوج المزود دفعة واحدة، اختر المزود ثم ادخل على القسم المطلوب. داخل كل قسم يمكنك استيراد منتج واحد مباشرة أو استيراد القسم كاملًا مع إنشاء الأقسام المحلية تلقائيًا عند الحاجة.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                            {targetSection ? <Link href={route('sections.show', targetSection.id)}><Button variant="outline" className="rounded-2xl">رجوع إلى القسم</Button></Link> : null}
                            {filters.root ? <Link href={route('sections.main')}><Button variant="outline" className="rounded-2xl">رجوع للمتجر</Button></Link> : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <form onSubmit={submitFilters} className="grid gap-4 xl:grid-cols-[1.2fr_220px_280px_170px_auto]">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">بحث في المكتبة المستوردة</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input value={data.search} onChange={(event) => setData('search', event.target.value)} placeholder="اسم المنتج، ID، أو اسم القسم القادم من المزود" className="pr-10" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">المزود</label>
                            <select value={data.providerSourceId} onChange={(event) => setData('providerSourceId', event.target.value)} className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                <option value="">اختر مزودًا</option>
                                {providerSources.filter((provider) => provider.is_active && provider.supports_catalog).map((provider) => (
                                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-emerald-700 dark:text-emerald-300">القسم الهدف للاستيراد</label>
                            <select
                                value={data.sectionId || ''}
                                onChange={(event) => {
                                    setData('sectionId', event.target.value);
                                    setData('root', 0);
                                }}
                                className="flex h-11 w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-white"
                            >
                                <option value="">تلقائي حسب أقسام المزود</option>
                                {importSections.map((section) => (
                                    <option key={section.id} value={section.id}>{section.label}</option>
                                ))}
                            </select>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                اختَر القسم من هنا قبل استيراد المنتج أو القسم كاملًا.
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">مكان الاستيراد</label>
                            <select
                                value={Number(data.root || 0)}
                                onChange={(event) => {
                                    const value = Number(event.target.value);
                                    setData('root', value);
                                    if (value === 1) setData('sectionId', '');
                                }}
                                className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value={0}>القسم المختار / تلقائي</option>
                                <option value={1}>الصفحة الرئيسية</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={processing} className="rounded-2xl xl:mt-7">تطبيق</Button>
                    </form>
                </section>


                <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 sm:p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-right">
                            <h2 className="text-xl font-black text-amber-900 dark:text-amber-100">استيراد شامل بالخلفية</h2>
                            <p className="mt-2 text-sm leading-7 text-amber-800 dark:text-amber-200">
                                اضغط مرة واحدة ليتم استيراد كل منتجات المزودات الفعالة تدريجيًا مع تفاصيل التقدم. يمكنك ترك الصفحة مفتوحة حتى يكتمل، ولن يتم تكرار المنتجات الموجودة.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={startAllProvidersImport}
                            disabled={allImportJob?.status === 'running'}
                            className="rounded-2xl bg-amber-600 px-6 py-3 font-black text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                            {allImportJob?.status === 'running' ? 'الاستيراد يعمل الآن...' : 'استيراد كل المنتجات'}
                        </Button>
                    </div>

                    {allImportJob && (
                        <div className="mt-5 rounded-2xl border border-amber-300 bg-white p-4 dark:border-amber-800 dark:bg-slate-950">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
                                <span>الحالة: {allImportJob.status}</span>
                                <span>المزودات: {allImportJob.progress?.completedProviders || 0}/{allImportJob.progress?.totalProviders || 0}</span>
                                <span>المنتجات: {allImportJob.progress?.display || '0/0'}</span>
                                <span>{allImportJob.progress?.percentage || 0}%</span>
                            </div>
                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all" style={{ width: `${allImportJob.progress?.percentage || 0}%` }} />
                            </div>
                            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                                <div>مستورد: {allImportJob.progress?.importedProducts || 0}</div>
                                <div>أضيف: {allImportJob.progress?.addedCards || 0}</div>
                                <div>محدّث: {allImportJob.progress?.existingCards || 0}</div>
                                <div>فشل: {allImportJob.progress?.failedProducts || 0}</div>
                            </div>
                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                {allImportJob.progress?.lastMessage || 'بانتظار بدء العمل...'}
                            </div>
                            {allImportJob.progress?.currentItem && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    الحالي: {allImportJob.progress.currentItem}
                                </div>
                            )}
                            {allImportJob.progress?.providers?.length ? (
                                <div className="mt-4 grid gap-2 md:grid-cols-2">
                                    {allImportJob.progress.providers.map((provider, index) => (
                                        <div key={provider.id || index} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
                                            <div className="font-black">{provider.name}</div>
                                            <div className="mt-1 text-slate-500">
                                                {provider.done ? 'مكتمل' : provider.started ? 'قيد التنفيذ' : 'بانتظار الدور'}
                                                {provider.progress ? ` - ${provider.progress.display}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                            {allImportJob.progress?.error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{allImportJob.progress.error}</div>}
                        </div>
                    )}
                </section>

                {data.providerSourceId ? (
                    <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-6 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 dark:text-white">{isSwGamesCatalog ? 'متصفح ألعاب وخدمات SW Games' : 'متصفح أقسام المزود'}</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {isSwGamesCatalog ? 'اختر القسم المناسب، ثم استورد المنتجات التي تريدها.' : 'ادخل على القسم الذي تريده، ثم استورد منتجًا واحدًا أو كل ما بداخله.'}
                                </p>
                            </div>
                            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                {remoteCatalog?.parentStack?.length ? (
                                    <Button type="button" variant="outline" className="rounded-2xl" onClick={goBackOneLevel}>
                                        رجوع خطوة
                                    </Button>
                                ) : null}
                                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => openCatalogLevel(0, [], [])}>{isSwGamesCatalog ? 'أقسام SW Games' : 'الأقسام الرئيسية'}</Button>
                                {remoteCatalog ? (
                                    <>
                                        <Button type="button" variant="outline" className="rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30" onClick={startCategoryScan} disabled={scanRunning}>
                                            <FolderTree className="ml-2 h-4 w-4" /> فحص هذا القسم فقط
                                        </Button>
                                        <Button type="button" className="rounded-2xl bg-sky-600 hover:bg-sky-700" onClick={importCategory} disabled={importJob?.status === 'running' || scanRunning}>
                                            <Download className="ml-2 h-4 w-4" /> {scanRunning ? 'انتظر انتهاء الفحص' : 'استيراد هذا القسم كاملًا'}
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {scanJob && (
                            <div className="mx-4 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 sm:mx-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                    <span>حالة فحص القسم: {scanJob.status}</span>
                                    <span>{scanJob.progress?.display || 'بانتظار الفحص'}</span>
                                    <span>{scanJob.progress?.percentage || 0}%</span>
                                </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all" style={{ width: `${scanJob.progress?.percentage || 0}%` }} />
                                </div>
                                <div className="mt-4 grid gap-3 text-xs font-black text-slate-700 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">الأقسام المكتشفة: {scanJob.progress?.discoveredCategories || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">المنتجات المكتشفة: {scanJob.progress?.discoveredProducts || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">تحتاج Player ID: {scanJob.progress?.playerIdProducts || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">غير متوفر: {scanJob.progress?.unavailableProducts || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">فئات/قيم داخل المنتجات: {scanJob.progress?.amountProducts || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">منتجات باقات: {scanJob.progress?.packageProducts || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">عناصر Leaf مشتبهة: {scanJob.progress?.leafProductCandidates || 0}</div>
                                    <div className="rounded-xl bg-white px-3 py-2 dark:bg-slate-900">أقسام متبقية للفحص: {scanJob.progress?.pendingCategories || 0}</div>
                                </div>
                                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {scanJob.progress?.lastMessage || 'بدأ الفحص…'}
                                </div>
                                {scanJob.progress?.currentItem && (
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">الحالي: {scanJob.progress.currentItem}</div>
                                )}
                                {scanJob.progress?.warnings?.length ? (
                                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                                        {scanJob.progress.warnings.map((warning, index) => <div key={index}>• {warning}</div>)}
                                    </div>
                                ) : null}
                                {scanJob.progress?.categorySamples?.length ? (
                                    <div className="mt-3 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                                        <div className="mb-2 text-xs font-black text-slate-600 dark:text-slate-300">أمثلة أقسام مكتشفة</div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {scanJob.progress.categorySamples.slice(0, 6).map((item, index) => <div key={index} className="truncate rounded-lg bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800">{item.path || item.name}</div>)}
                                        </div>
                                    </div>
                                ) : null}
                                {scanJob.progress?.productSamples?.length ? (
                                    <div className="mt-3 rounded-xl bg-white px-3 py-2 dark:bg-slate-900">
                                        <div className="mb-2 text-xs font-black text-slate-600 dark:text-slate-300">أمثلة منتجات مكتشفة</div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {scanJob.progress.productSamples.slice(0, 6).map((item, index) => <div key={index} className="truncate rounded-lg bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800">{item.path ? `${item.path} / ` : ''}{item.name}</div>)}
                                        </div>
                                    </div>
                                ) : null}
                                {scanJob.progress?.error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{scanJob.progress.error}</div>}
                                {scanCompleted && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm dark:border-emerald-900/40 dark:bg-slate-900">
                                        <span className="font-bold text-emerald-700 dark:text-emerald-300">إذا الأرقام والشجرة منطقية، ابدأ الاستيراد التدريجي لهذا القسم.</span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setScanJob(null)}>مسح تقرير الفحص</Button>
                                            <Button type="button" className="rounded-2xl bg-sky-600 hover:bg-sky-700" onClick={importCategory} disabled={importJob?.status === 'running' || !scanCanImport}>ابدأ الاستيراد الآن</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {importJob && (
                            <div className="mx-4 mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/40 dark:bg-sky-950/30 sm:mx-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-sky-900 dark:text-sky-100">
                                    <span>حالة استيراد القسم: {importJob.status}</span>
                                    <span>{importJob.progress?.display || 'بانتظار الاكتشاف'}</span>
                                    <span>{importJob.progress?.percentage || 0}%</span>
                                </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-600 transition-all" style={{ width: `${importJob.progress?.percentage || 0}%` }} />
                                </div>
                                <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-5">
                                    <div>مكتشف: {importJob.progress?.discoveredProducts || importJob.progress?.totalProducts || 0}</div>
                                    <div>تمت معالجته: {importJob.progress?.processedProducts || 0}</div>
                                    <div>أضيف: {importJob.progress?.addedCards || 0}</div>
                                    <div>محدّث: {importJob.progress?.existingCards || 0}</div>
                                    <div>فشل: {importJob.progress?.failedProducts || 0}</div>
                                </div>
                                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {importJob.progress?.lastMessage || 'بدأت العملية…'}
                                </div>
                                {importJob.progress?.currentItem && (
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        الحالي: {importJob.progress.currentItem}
                                    </div>
                                )}
                                {importJob.progress?.error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{importJob.progress.error}</div>}
                                {importJob.status === 'failed' && (
                                    <div className="mt-3 flex justify-end">
                                        <Button type="button" className="rounded-2xl bg-sky-600 hover:bg-sky-700" onClick={importCategory}>
                                            إعادة المحاولة
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}


                        <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                            {remoteCatalog?.error ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                                    {remoteCatalog.error}
                                </div>
                            ) : null}

                            {remoteCatalog ? (
                                <>

                            {(remoteCatalog?.categories?.length || 0) > visibleCategories.length || (remoteCatalog?.products?.length || 0) > visibleProducts.length ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                    يتم عرض كل الأقسام والمنتجات المتاحة لهذا المزود.
                                </div>
                            ) : null}
                                    <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        {remoteCatalog.parentStack?.length ? (
                                            <Button type="button" variant="outline" className="rounded-2xl" onClick={goBackOneLevel}>
                                                رجوع خطوة
                                            </Button>
                                        ) : null}
                                        {remoteCatalog.trail.length ? (
                                            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => openCatalogLevel(0, [], [])}>
                                                الرئيسية
                                            </Button>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold dark:bg-slate-800">الرئيسية</span>
                                        )}
                                        {remoteCatalog.trail.map((name, index) => (
                                            <div key={`${name}-${index}`} className="flex items-center gap-2">
                                                <ChevronLeft className="h-4 w-4" />
                                                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold dark:bg-slate-800">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {visibleCategories.map((category) => (
                                            <button
                                                key={`cat-${category.id}`}
                                                type="button"
                                                onClick={() => openCatalogLevel(category.id, [...(remoteCatalog.trail || []), category.name], [...(remoteCatalog.parentStack || []), category.id])}
                                                className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-right transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-sky-700 dark:hover:bg-sky-950/20"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    {category.image ? <img src={category.image} alt={category.name} loading="lazy" referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-xl dark:bg-slate-800">📁</div>}
                                                    <div>
                                                        <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{isSwGamesCatalog ? 'لعبة / خدمة من SW Games' : 'قسم من المزود'}</div>
                                                        <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{category.name}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {remoteCatalog.categories.length > 0 && remoteCatalog.products.length > 0 ? (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                            هذا المستوى يحتوي أقسامًا فرعية ومنتجات مباشرة معًا.
                                        </div>
                                    ) : null}

{showRemoteProducts ? (
                                        <>
                                            <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-sky-800 dark:text-sky-200">
                                                            استيراد منتجات محددة
                                                        </div>
                                                        <div className="mt-1 text-xs text-sky-700 dark:text-sky-300">
                                                            اختر المنتجات ثم حدد القسم الهدف من الأعلى واضغط استيراد المحدد.
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                                        <Button type="button" variant="outline" className="rounded-2xl" onClick={selectAllVisibleProducts}>
                                                            تحديد كل الظاهر ({visibleProducts.length})
                                                        </Button>
                                                        <Button type="button" variant="outline" className="rounded-2xl" onClick={clearSelectedRemoteProducts}>
                                                            إلغاء التحديد
                                                        </Button>
                                                        <Button type="button" disabled={bulkImporting || selectedRemoteProducts.length === 0} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={importSelectedProducts}>
                                                            {bulkImporting ? 'جارٍ الاستيراد...' : `استيراد المحدد (${selectedRemoteProducts.length})`}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                                    القسم الهدف: {targetSection ? targetSection.name : (data.root ? 'الصفحة الرئيسية' : 'تلقائي حسب أقسام المزود')}
                                                </div>
                                                {bulkImportMessage && (
                                                    <div className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                                                        {bulkImportMessage}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {visibleProducts.map((product) => (
                                                <div key={`remote-${product.id}`} className={`rounded-[20px] border p-4 transition ${selectedRemoteProducts.includes(String(product.id)) ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40'}`}>
                                                    <label className="mb-3 flex cursor-pointer items-center justify-end gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                                        <span>تحديد هذا المنتج</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRemoteProducts.includes(String(product.id))}
                                                            onChange={() => toggleSelectedRemoteProduct(product.id)}
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                        />
                                                    </label>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">منتج مباشر من API</div>
                                                            <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{product.name}</h3>
                                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {product.id}</div>
                                                        </div>
                                                        {product.image ? <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl dark:bg-slate-800">🎮</div>}
                                                    </div>

                                                    <div className="mt-4 space-y-3 text-sm">
                                                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                                            <div className="mb-1 flex items-center justify-end gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><FolderTree className="h-4 w-4" /> {targetSectionName}</div>
                                                            <div>{(remoteCatalog.trail || []).join(' / ') || product.categoryName || 'بدون تصنيف'}</div>
                                                        </div>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            <div className="rounded-2xl bg-white px-3 py-2 dark:bg-slate-900">
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">سعر المزود</div>
                                                                <div className="mt-1 font-black text-slate-950 dark:text-white">${money(product.costPrice)}</div>
                                                            </div>
                                                            <div className="rounded-2xl bg-white px-3 py-2 dark:bg-slate-900">
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">السعر الحالي</div>
                                                                <div className="mt-1 font-black text-slate-950 dark:text-white">${money(product.price)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {product.requiresPlayerId ? 'يحتاج معرف اللاعب' : 'لا يحتاج معرف لاعب'}
                                                            {product.requiresSecondaryPlayerId ? ' + حقل إضافي' : ''}
                                                        </div>
                                                        {product.isImported ? (
                                                            <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">هذا المنتج موجود مسبقًا في المتجر.</div>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                                                        <Button type="button" className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={() => importProduct(product.id)}>
                                                            <PackagePlus className="ml-2 h-4 w-4" /> استيراد هذا المنتج
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        </>
                                    ) : (
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                                            تم إخفاء المنتجات في هذا المستوى لأن هذا المستوى يحتوي أقسامًا فرعية. ادخل على القسم المطلوب أولًا ليظهر لك فقط ما يخصه.
                                        </div>
                                    )}

                                    {!remoteCatalog.categories.length && !remoteCatalog.products.length ? (
                                        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                            لا توجد عناصر في هذا القسم حالياً.
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                    اختر المزود ثم اضغط على "تطبيق" لعرض {isSwGamesCatalog ? 'أقسام SW Games' : 'الأقسام الرئيسية'}.
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}

{!browsingRemoteCatalog ? (
                <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6 dark:border-slate-800">
                        <div className="text-sm text-slate-500 dark:text-slate-400">{products.total} منتج محفوظ بالمكتبة المستوردة</div>
                        <div>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">المكتبة المستوردة</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">هذه المنتجات التي تم حفظها مسبقًا ويمكن إضافتها يدويًا أيضًا.</p>
                        </div>
                    </div>

                    <div className="grid gap-3 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                        {products.data.map((product) => (
                            <div key={product.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{product.providerName || 'مزود'}</div>
                                        <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{product.name}</h3>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {product.remoteId}</div>
                                    </div>
                                    {product.image ? <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl dark:bg-slate-800">🎮</div>}
                                </div>

                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="rounded-2xl bg-white px-3 py-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                        <div className="mb-1 flex items-center justify-end gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><FolderTree className="h-4 w-4" /> المسار القادم من المزود</div>
                                        <div>{product.categoryPath || 'بدون تصنيف فرعي'}</div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-white px-3 py-2 dark:bg-slate-900">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">سعر المزود</div>
                                            <div className="mt-1 font-black text-slate-950 dark:text-white">${money(product.costPrice)}</div>
                                        </div>
                                        <div className="rounded-2xl bg-white px-3 py-2 dark:bg-slate-900">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">السعر الحالي</div>
                                            <div className="mt-1 font-black text-slate-950 dark:text-white">${money(product.price)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => router.post(route('importedProducts.publish', product.id), { sectionId: data.sectionId || undefined, root: Boolean(data.root) })}
                                    >
                                        <PackagePlus className="ml-2 h-4 w-4" /> إضافة من المكتبة
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!products.data.length && (
                        <div className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                            لا توجد منتجات محفوظة في المكتبة بهذه الفلاتر.
                        </div>
                    )}
                </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

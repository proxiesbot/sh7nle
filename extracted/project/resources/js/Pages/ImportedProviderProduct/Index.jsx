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
    const [perProviderJobs, setPerProviderJobs] = useState({});
    const perProviderPollRefs = useRef({});
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

    const normalizedSections = useMemo(() => importSections.map((section) => ({
        ...section,
        id: Number(section.id),
        parentId: Number(section.parentId || 0),
    })), [importSections]);

    const sectionById = useMemo(() => {
        const map = new Map();
        normalizedSections.forEach((section) => map.set(section.id, section));
        return map;
    }, [normalizedSections]);

    const sectionsByParent = useMemo(() => {
        const map = new Map();
        normalizedSections.forEach((section) => {
            const parentId = Number(section.parentId || 0);
            if (!map.has(parentId)) {
                map.set(parentId, []);
            }
            map.get(parentId).push(section);
        });
        return map;
    }, [normalizedSections]);

    const mainSections = sectionsByParent.get(0) || [];

    const selectedLocalPath = useMemo(() => {
        const path = [];
        let current = sectionById.get(Number(data.sectionId || 0));
        const guard = new Set();

        while (current && !guard.has(current.id)) {
            guard.add(current.id);
            path.unshift(current);
            current = sectionById.get(Number(current.parentId || 0));
        }

        return path;
    }, [data.sectionId, sectionById]);

    const selectedLocalSection = selectedLocalPath[selectedLocalPath.length - 1] || null;
    const localDestinationLabel = data.root
        ? 'الصفحة الرئيسية مباشرة'
        : selectedLocalSection
            ? selectedLocalPath.map((section) => section.name).join(' / ')
            : 'تلقائي حسب مسار المزود';

    const selectLocalSectionLevel = (levelIndex, rawValue) => {
        if (rawValue === '') {
            if (levelIndex === 0) {
                setData('sectionId', '');
                setData('root', 0);
                return;
            }

            const fallback = selectedLocalPath[levelIndex - 1];
            setData('sectionId', fallback ? String(fallback.id) : '');
            setData('root', 0);
            return;
        }

        setData('sectionId', rawValue);
        setData('root', 0);
    };


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
            Object.values(perProviderPollRefs.current).forEach((timerId) => {
                if (timerId) window.clearTimeout(timerId);
            });
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

        const response = await fetch(url, {
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

    const startSingleProviderImport = async (providerId) => {
        const currentJob = perProviderJobs[providerId];
        if (currentJob?.status === 'running') {
            return;
        }

        try {
            const response = await jsonRequest(route('importedProducts.importAll.start'), {
                providerSourceIds: [providerId],
                sectionId: data.sectionId || undefined,
                root: Boolean(data.root),
            });

            setPerProviderJobs((prev) => ({ ...prev, [providerId]: response }));
            scheduleNextPerProviderStep(providerId, response.jobId);
        } catch (error) {
            window.alert(error.message || 'تعذر بدء استيراد هذا المزود.');
        }
    };

    const scheduleNextPerProviderStep = (providerId, jobId) => {
        if (perProviderPollRefs.current[providerId]) {
            window.clearTimeout(perProviderPollRefs.current[providerId]);
        }

        perProviderPollRefs.current[providerId] = window.setTimeout(async () => {
            try {
                const response = await jsonRequest(route('importedProducts.importAll.process'), {
                    jobId,
                });
                setPerProviderJobs((prev) => ({ ...prev, [providerId]: response }));

                if (response.status === 'running') {
                    scheduleNextPerProviderStep(providerId, jobId);
                    return;
                }

                router.reload({ only: ['products', 'remoteCatalog'] });
            } catch (error) {
                setPerProviderJobs((prev) => ({
                    ...prev,
                    [providerId]: {
                        ...(prev[providerId] || {}),
                        status: 'failed',
                        progress: {
                            ...(prev[providerId]?.progress || {}),
                            error: error.message,
                            lastMessage: error.message,
                        },
                    },
                }));
            }
        }, 750);
    };


    const contextLabel = useMemo(() => {
        if (data.root) {
            return 'سيتم الإضافة مباشرة إلى الصفحة الرئيسية للمتجر';
        }

        if (selectedLocalSection) {
            return `سيتم استيراد المنتجات داخل: ${localDestinationLabel}`;
        }

        return 'اختر القسم الرئيسي أولاً، ثم اختر قسمًا فرعيًا عند الحاجة أو اتركه تلقائيًا حسب مسار المزود.';
    }, [data.root, selectedLocalSection, localDestinationLabel]);

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
        <AdminLayout title="مركز الاستيراد السريع">
            <Head title="مركز الاستيراد">
                <meta name="description" content="استيراد منتجات المزود بشكل أوضح وأدق." />
            </Head>

            <div className="space-y-6 text-right">
                <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                <Boxes className="h-4 w-4" />
                                {contextLabel}
                            </div>
                            <h1 className="text-2xl font-black text-slate-950 dark:text-white">مركز الاستيراد السريع</h1>
                            <p className="max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                                اختر المزود، ادخل إلى القسم المطلوب من المزود، ثم استورد المنتج أو القسم الحالي فقط. تم تبسيط الصفحة حتى يكون الاستيراد أوضح وأقل عشوائية.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                            {targetSection ? <Link href={route('sections.show', targetSection.id)}><Button variant="outline" className="rounded-2xl">رجوع إلى القسم</Button></Link> : null}
                            {filters.root ? <Link href={route('sections.main')}><Button variant="outline" className="rounded-2xl">رجوع للمتجر</Button></Link> : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <form onSubmit={submitFilters} className="grid gap-4 xl:grid-cols-[1.1fr_220px_1.4fr_auto]">
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
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <label className="block text-sm font-black text-emerald-800 dark:text-emerald-200">مكان وضع المنتجات عندي</label>
                                    <p className="mt-1 text-xs leading-5 text-emerald-700/80 dark:text-emerald-300/80">
                                        تظهر الأقسام الرئيسية أولًا فقط. بعد اختيار قسم رئيسي تظهر أقسامه الفرعية، وتقدر توقف بأي مستوى وتستورد داخله مباشرة.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('sectionId', '');
                                            setData('root', 0);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-black transition ${!data.root && !data.sectionId ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}
                                    >
                                        تلقائي حسب المزود
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('sectionId', '');
                                            setData('root', 1);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-xs font-black transition ${data.root ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}
                                    >
                                        الصفحة الرئيسية
                                    </button>
                                </div>
                            </div>

                            {!data.root ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">القسم الرئيسي</label>
                                        <select
                                            value={selectedLocalPath[0]?.id || ''}
                                            onChange={(event) => selectLocalSectionLevel(0, event.target.value)}
                                            className="flex h-11 w-full rounded-2xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="">بدون قسم محدد / تلقائي</option>
                                            {mainSections.map((section) => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedLocalPath.map((section, index) => {
                                        const children = sectionsByParent.get(section.id) || [];
                                        if (!children.length) {
                                            return null;
                                        }

                                        const selectedChild = selectedLocalPath[index + 1]?.id || '';

                                        return (
                                            <div key={`local-child-${section.id}`}>
                                                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    قسم داخل: {section.name}
                                                </label>
                                                <select
                                                    value={selectedChild}
                                                    onChange={(event) => selectLocalSectionLevel(index + 1, event.target.value)}
                                                    className="flex h-11 w-full rounded-2xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
                                                >
                                                    <option value="">استيراد مباشر داخل {section.name}</option>
                                                    {children.map((child) => (
                                                        <option key={child.id} value={child.id}>{child.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}

                            <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-200">
                                الوجهة الحالية: {localDestinationLabel}
                            </div>
                        </div>
                        <Button type="submit" disabled={processing} className="rounded-2xl xl:mt-7">تطبيق</Button>
                    </form>
                </section>

                {/* Per-Provider Import Section */}
                <section className="rounded-[24px] border border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 p-4 sm:p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:to-sky-950/30">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">🚀 استيراد سريع لكل مزود</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                اضغط على الزر الخاص بكل مزود لبدء استيراد جميع منتجاته. يمكنك تشغيل أكثر من مزود في نفس الوقت.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {providerSources.filter((provider) => provider.is_active && provider.supports_catalog).map((provider) => {
                            const job = perProviderJobs[provider.id];
                            const isRunning = job?.status === 'running';
                            const isCompleted = job?.status === 'completed';
                            const isFailed = job?.status === 'failed';
                            const progress = job?.progress || {};

                            return (
                                <div key={`provider-import-${provider.id}`} className={`rounded-[20px] border p-4 transition ${isRunning ? 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30' : isCompleted ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : isFailed ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <span className="text-2xl">{provider.driver === 'swgames' ? '🎮' : '☀️'}</span>
                                        <div className="text-right">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{provider.name}</h3>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{provider.driver}</span>
                                        </div>
                                    </div>

                                    {isRunning && (
                                        <div className="mb-3 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-200">
                                                <span>جارٍ الاستيراد...</span>
                                                <span>{progress.percentage || 0}%</span>
                                            </div>
                                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-600 transition-all duration-300" style={{ width: `${progress.percentage || 0}%` }} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <div>مكتشف: <span className="font-black">{progress.discoveredProducts || progress.totalProducts || 0}</span></div>
                                                <div>تمت معالجته: <span className="font-black">{progress.processedProducts || 0}</span></div>
                                                <div>أُضيف: <span className="font-black text-emerald-700 dark:text-emerald-300">{progress.addedCards || 0}</span></div>
                                                <div>محدّث: <span className="font-black">{progress.existingCards || 0}</span></div>
                                            </div>
                                            {progress.lastMessage && (
                                                <div className="rounded-xl bg-white px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {progress.lastMessage}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="mb-3 space-y-2">
                                            <div className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                ✅ اكتمل الاستيراد بنجاح
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <div>أُضيف: <span className="font-black text-emerald-700 dark:text-emerald-300">{progress.addedCards || 0}</span></div>
                                                <div>محدّث: <span className="font-black">{progress.existingCards || 0}</span></div>
                                                <div>فشل: <span className="font-black text-rose-600">{progress.failedProducts || 0}</span></div>
                                                <div>إجمالي: <span className="font-black">{progress.processedProducts || 0}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {isFailed && (
                                        <div className="mb-3 rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                                            ❌ {progress.error || 'فشل الاستيراد'}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        disabled={isRunning}
                                        className={`w-full rounded-2xl ${isRunning ? 'bg-slate-400' : provider.driver === 'swgames' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                                        onClick={() => startSingleProviderImport(provider.id)}
                                    >
                                        <Download className="ml-2 h-4 w-4" />
                                        {isRunning ? 'جارٍ الاستيراد...' : `استيراد منتجات ${provider.name}`}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </section>


                {data.providerSourceId ? (
                    <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-6 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 dark:text-white">{isSwGamesCatalog ? 'متصفح SW Games الدقيق' : 'متصفح أقسام المزود'}</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {isSwGamesCatalog ? 'يعرض SW Games حسب الأقسام الرئيسية الظاهرة بموقع المزود، ثم الأقسام الفرعية داخلها، بدل تحويل أسماء التطبيقات إلى أقسام رئيسية.' : 'ادخل على القسم الذي تريده، ثم استورد منتجًا واحدًا أو كل ما بداخله.'}
                                </p>
                            </div>
                            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                {remoteCatalog?.parentStack?.length ? (
                                    <Button type="button" variant="outline" className="rounded-2xl" onClick={goBackOneLevel}>
                                        رجوع خطوة
                                    </Button>
                                ) : null}
                                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => openCatalogLevel(0, [], [])}>{isSwGamesCatalog ? 'أماكن SW Games' : 'الأقسام الرئيسية'}</Button>
                                {remoteCatalog ? (
                                    <>
                                        <Button type="button" className="rounded-2xl bg-sky-600 hover:bg-sky-700" onClick={importCategory} disabled={importJob?.status === 'running'}>
                                            <Download className="ml-2 h-4 w-4" /> استيراد القسم الحالي
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>

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
                                                        <div className="text-xs font-bold text-sky-700 dark:text-sky-300">{isSwGamesCatalog ? 'قسم من موقع SW Games' : 'قسم من المزود'}</div>
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
                                                    القسم الهدف: {localDestinationLabel}
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
                                                            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">منتج داخل هذا القسم</div>
                                                            <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{product.name}</h3>
                                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {product.id}</div>
                                                        </div>
                                                        {product.image ? <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl dark:bg-slate-800">🎮</div>}
                                                    </div>

                                                    <div className="mt-4 space-y-3 text-sm">
                                                        <div className="rounded-2xl bg-white px-3 py-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                                            <div className="mb-1 flex items-center justify-end gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><FolderTree className="h-4 w-4" /> المسار القادم من المزود</div>
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
                                    اختر المزود ثم اضغط على "تطبيق" لعرض {isSwGamesCatalog ? 'أماكن SW Games' : 'الأقسام الرئيسية'}.
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

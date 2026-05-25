import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
    locale: 'sh7nle_locale',
    dark: 'sh7nle_dark_mode',
};

const PREF_EVENT = 'sh7nle:preferences';

const messages = {
    ar: {
        home: 'الرئيسية',
        account: 'حسابي',
        profile: 'الملف الشخصي',
        deposit: 'إيداع الرصيد',
        orders: 'طلباتي',
        notifications: 'الإشعارات',
        referral: 'الإحالة',
        store: 'المتجر',
        transactions: 'عمليات الإيداع',
        admin: 'لوحة الإدارة',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        logout: 'تسجيل الخروج',
        language: 'اللغة',
        changeLanguage: 'تغيير اللغة',
        darkMode: 'الوضع المظلم',
        lightMode: 'الوضع الفاتح',
        searchSections: 'ابحث عن قسم أو منتج...',
        sections: 'الأقسام',
        mainSections: 'الأقسام الرئيسية',
        products: 'المنتجات',
        availableCategories: 'الفئات المتوفرة',
        noResults: 'لا توجد نتائج مطابقة',
        noResultsHint: 'جرّب اسمًا مختلفًا أو امسح البحث.',
        browseSection: 'استعراض القسم',
        social: 'تابعنا',
        menu: 'الخيارات',
        quickMenu: 'قائمة الخيارات',
        balance: 'الرصيد',
        storeTagline: 'منصة شحن ألعاب وخدمات رقمية',
        support: 'الدعم',
        wheel: 'عجلة الفرصة',
        wallet: 'المحفظة',
        giftCard: 'Gift Card',
        categoriesOnly: 'تصفح الأقسام واختر اللعبة أو الخدمة التي تريدها.',
        bannerAlt: 'بانر المتجر',
        languageLabel: 'العربية',
        englishLabel: 'English',
        save: 'حفظ',
        manualReview: 'مراجعة يدوية',
        instant: 'فوري',
        deliveryInsideOrders: 'يظهر ضمن طلباتي',
        chooseCategory: 'اختر الفئة',
        chooseQuantity: 'العدد',
        totalPrice: 'السعر الإجمالي',
        purchaseNow: 'شراء الآن',
        loginFirst: 'سجّل الدخول أولًا',
        confirmPurchase: 'تأكيد الشراء',
        purchaseMethod: 'طريقة الشراء',
        price: 'السعر',
        type: 'النوع',
        input: 'الإدخال',
        availableRange: 'المجال المتاح',
        addBalance: 'إضافة رصيد',
        editProfile: 'تعديل البيانات',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        whatsapp: 'رقم الواتساب',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        changePassword: 'تغيير كلمة المرور',
        security: 'الأمان',
        auth2fa: 'التحقق بخطوتين',
        enable2fa: 'تفعيل التحقق بخطوتين',
        disable2fa: 'إيقاف التحقق بخطوتين',
        loginTitle: 'مرحبًا بعودتك',
        loginHint: 'سجّل الدخول للوصول إلى المتجر وطلباتك.',
        registerTitle: 'أنشئ حسابك',
        registerHint: 'ابدأ الشراء ومتابعة الطلبات من مكان واحد.',
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        signIn: 'دخول',
        signUp: 'إنشاء الحساب',
        backToStore: 'العودة للمتجر',
        providerSource: 'مصدر المنتج',
        providerSourceSawa: 'SawaCard API',
        providerSourceManual: 'يدوي',
        providerProductId: 'رقم المنتج عند المزود',
        fetchProviderData: 'جلب السعر والبيانات',
        baseCost: 'التكلفة الأساسية',
        salePrice: 'سعر البيع',
        profitRate: 'نسبة الربح الحالية',
        section: 'القسم',
        source: 'المصدر',
        purchaseDisplayMode: 'طريقة الشراء',
        providerDetails: 'بيانات المزود',
        primaryIdLabel: 'اسم حقل الـ ID الأول',
        secondaryIdLabel: 'اسم حقل الـ ID الثاني',
        categoryButtonsHint: 'الفئات ستظهر كأزرار للمستخدم.',
        noMinMax: 'بدون حد أدنى أو أعلى',
        contentByCategory: 'تصفح الأقسام واختر ما يناسبك',
        accountSettings: 'إعدادات الحساب',
        categoryGroup: 'قسم داخلي للمنتج',
        addOption: 'إضافة فئة',
        optionName: 'اسم الفئة',
        optionPrice: 'سعر الفئة',
        optionCost: 'تكلفة الفئة',
        remove: 'حذف',
    },
    en: {
        home: 'Home',
        account: 'My Account',
        profile: 'Profile',
        deposit: 'Add Balance',
        orders: 'My Orders',
        notifications: 'Notifications',
        referral: 'Referral',
        store: 'Store',
        transactions: 'Deposits',
        admin: 'Admin Panel',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        language: 'Language',
        changeLanguage: 'Change Language',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        searchSections: 'Search categories or products...',
        sections: 'Categories',
        mainSections: 'Main Categories',
        products: 'Products',
        availableCategories: 'Available Options',
        noResults: 'No matching results',
        noResultsHint: 'Try a different search or clear the filter.',
        browseSection: 'Browse Section',
        social: 'Follow us',
        menu: 'Menu',
        quickMenu: 'Quick Menu',
        balance: 'Balance',
        storeTagline: 'Gaming and digital services store',
        support: 'Support',
        wheel: 'Chance Wheel',
        wallet: 'Wallet',
        giftCard: 'Gift Card',
        categoriesOnly: 'Browse categories and choose the game or service you want.',
        bannerAlt: 'Store banner',
        languageLabel: 'Arabic',
        englishLabel: 'English',
        save: 'Save',
        manualReview: 'Manual review',
        instant: 'Instant',
        deliveryInsideOrders: 'Appears in orders',
        chooseCategory: 'Choose option',
        chooseQuantity: 'Quantity',
        totalPrice: 'Total price',
        purchaseNow: 'Buy now',
        loginFirst: 'Login first',
        confirmPurchase: 'Confirm Purchase',
        purchaseMethod: 'Purchase method',
        price: 'Price',
        type: 'Type',
        input: 'Input',
        availableRange: 'Available range',
        addBalance: 'Add Balance',
        editProfile: 'Edit profile',
        name: 'Name',
        email: 'Email',
        whatsapp: 'WhatsApp number',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm password',
        changePassword: 'Change password',
        security: 'Security',
        auth2fa: 'Two-factor authentication',
        enable2fa: 'Enable 2FA',
        disable2fa: 'Disable 2FA',
        loginTitle: 'Welcome back',
        loginHint: 'Sign in to access the store and your orders.',
        registerTitle: 'Create your account',
        registerHint: 'Start shopping and tracking orders from one place.',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        signIn: 'Sign In',
        signUp: 'Create account',
        backToStore: 'Back to store',
        providerSource: 'Product source',
        providerSourceSawa: 'SawaCard API',
        providerSourceManual: 'Manual',
        providerProductId: 'Provider product ID',
        fetchProviderData: 'Fetch provider data',
        baseCost: 'Base cost',
        salePrice: 'Sale price',
        profitRate: 'Current profit rate',
        section: 'Section',
        source: 'Source',
        purchaseDisplayMode: 'Purchase flow',
        providerDetails: 'Provider details',
        primaryIdLabel: 'Primary ID label',
        secondaryIdLabel: 'Secondary ID label',
        categoryButtonsHint: 'Options will appear as buttons for the customer.',
        noMinMax: 'No minimum or maximum',
        contentByCategory: 'Browse categories and choose what fits you',
        accountSettings: 'Account settings',
        categoryGroup: 'Internal product group',
        addOption: 'Add option',
        optionName: 'Option name',
        optionPrice: 'Option price',
        optionCost: 'Option cost',
        remove: 'Remove',
    },
};

function readLocale() {
    if (typeof window === 'undefined') return 'ar';
    return localStorage.getItem(STORAGE_KEYS.locale) || 'ar';
}

function readDark() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.dark) === '1';
}

function broadcastPreferences(detail) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail }));
}

export function useSitePreferences() {
    const [locale, setLocaleState] = useState(readLocale);
    const [isDark, setIsDarkState] = useState(readDark);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const syncPreferences = (event) => {
            const nextLocale = event?.detail?.locale ?? readLocale();
            const nextDark = typeof event?.detail?.isDark === 'boolean' ? event.detail.isDark : readDark();
            setLocaleState(nextLocale);
            setIsDarkState(nextDark);
        };

        window.addEventListener('storage', syncPreferences);
        window.addEventListener(PREF_EVENT, syncPreferences);

        return () => {
            window.removeEventListener('storage', syncPreferences);
            window.removeEventListener(PREF_EVENT, syncPreferences);
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.lang = locale;
        root.dir = locale === 'ar' ? 'rtl' : 'ltr';
        root.classList.toggle('dark', isDark);
    }, [locale, isDark]);

    const setLocale = (nextLocale, options = {}) => {
        if (typeof window === 'undefined') return;
        const value = nextLocale === 'en' ? 'en' : 'ar';
        const shouldReload = options.reload !== false;
        const changed = readLocale() !== value;

        localStorage.setItem(STORAGE_KEYS.locale, value);
        setLocaleState(value);
        broadcastPreferences({ locale: value, isDark: readDark() });

        // لغة الموقع مؤثرة على اتجاه الصفحة والنصوص الثابتة داخل Inertia.
        // لذلك نعمل Refresh كامل افتراضيًا حتى تتبدل كل الواجهات بدون بقاء نصوص قديمة.
        if (changed && shouldReload) {
            window.requestAnimationFrame(() => window.location.reload());
        }
    };

    const setIsDark = (nextValue) => {
        if (typeof window === 'undefined') return;
        const value = typeof nextValue === 'function' ? !!nextValue(readDark()) : !!nextValue;
        localStorage.setItem(STORAGE_KEYS.dark, value ? '1' : '0');
        setIsDarkState(value);
        broadcastPreferences({ locale: readLocale(), isDark: value });
    };

    const isArabic = locale === 'ar';
    const t = useMemo(() => messages[locale] || messages.ar, [locale]);

    return { locale, setLocale, isArabic, isDark, setIsDark, t };
}

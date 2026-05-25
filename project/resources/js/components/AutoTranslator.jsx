import { useEffect } from 'react';
import { useSitePreferences } from '@/lib/sitePreferences';

const originalTextMap = new WeakMap();

const dictionary = {
    'إعدادات المتجر': 'Store Settings',
    'إعدادات الحساب': 'Account Settings',
    'مرحبًا': 'Welcome',
    'المتجر': 'Store',
    'انتقال سريع': 'Quick link',
    'إيداع الرصيد': 'Add Balance',
    'طلباتي': 'My Orders',
    'الإشعارات': 'Notifications',
    'الرصيد': 'Balance',
    'البريد الإلكتروني': 'Email',
    'المستوى': 'Level',
    'مستوى العميل': 'Customer Level',
    'الرصيد المستهلك': 'Used Balance',
    'تعديل البيانات': 'Edit Profile',
    'الاسم': 'Name',
    'رقم الواتساب': 'WhatsApp Number',
    'حفظ': 'Save',
    'تغيير كلمة المرور': 'Change Password',
    'كلمة المرور الحالية': 'Current Password',
    'كلمة المرور الجديدة': 'New Password',
    'تأكيد كلمة المرور': 'Confirm Password',
    'تفعيل التحقق بخطوتين': 'Enable Two-Factor Authentication',
    'التحقق بخطوتين': 'Two-Factor Authentication',
    'طرق الدفع': 'Payment Methods',
    'إضافة طريقة': 'Add Method',
    'الصورة': 'Image',
    'المزوّد': 'Provider',
    'النوع': 'Type',
    'المتطلبات': 'Requirements',
    'الحالة': 'Status',
    'الإجراءات': 'Actions',
    'تعديل': 'Edit',
    'حذف': 'Delete',
    'مفعلة': 'Active',
    'معطلة': 'Disabled',
    'يدوي': 'Manual',
    'أوتوماتيكي': 'Automatic',
    'رقم عملية': 'Transaction ID',
    'صورة': 'Image',
    'بدون متطلبات': 'No requirements',
    'إضافة طريقة دفع': 'Add Payment Method',
    'تعديل طريقة الدفع': 'Edit Payment Method',
    'اسم الطريقة': 'Method Name',
    'الحساب / المحفظة / الوصف المختصر': 'Account / Wallet / Short Description',
    'ملاحظات': 'Notes',
    'صورة الطريقة': 'Method Image',
    'مفعلة؟': 'Active?',
    'طريقة أوتوماتيكية؟': 'Automatic Method?',
    'طلب رقم العملية': 'Require Transaction ID',
    'طلب صورة الإشعار': 'Require Receipt Image',
    'متاحة لسحب أرباح الإحالة': 'Available for Referral Withdrawals',
    'حفظ الطريقة': 'Save Method',
    'إيداع الرصيد بالدولار': 'Deposit Balance in USD',
    'شحن الرصيد': 'Add Balance',
    'وسيلة الدفع': 'Payment Method',
    'المبلغ بالدولار': 'Amount in USD',
    'العملة': 'Currency',
    'ثابتة': 'Fixed',
    'تفاصيل الدفع': 'Payment Details',
    'المبلغ المطلوب إرساله': 'Amount to Send',
    'أرسل المبلغ إلى الحساب التالي': 'Send the amount to this account',
    'نسخ': 'Copy',
    'رقم العملية بعد الدفع': 'Transaction ID After Payment',
    'تأكيد الدفع': 'Confirm Payment',
    'الدفع الآن': 'Pay Now',
    'صورة الإشعار': 'Receipt Image',
    'ملاحظات إضافية': 'Additional Notes',
    'إرسال الطلب': 'Submit Request',
    'ماذا يحدث بعد التأكيد؟': 'What Happens After Confirmation?',
    'إذا تم التحقق من العملية سيتم إضافة الرصيد فورًا.': 'If the transaction is verified, the balance will be added immediately.',
    'إذا لم يتم التحقق فورًا، سيظهر الطلب ضمن إيداعاتك بحالة قيد المعالجة.': 'If not verified immediately, it will appear as pending in your deposits.',
    'إذا احتاج الطلب مراجعة، سيتم التعامل معه من قبل الإدارة.': 'If it requires review, the admin team will handle it.',
    'لا يمكن استخدام نفس رقم العملية مرتين.': 'The same transaction ID cannot be used twice.',
    'الذهاب إلى إيداعاتي': 'Go to My Deposits',
    'لوحة الإدارة': 'Admin Panel',
    'المستخدمون': 'Users',
    'الدعم': 'Support',
    'عجلة الفرصة': 'Chance Wheel',
    'محفظة الموقع': 'Site Wallet',
    'طلبات الإيداع': 'Deposit Requests',
    'الطلبات': 'Orders',
    'طلبات أرباح الإحالة': 'Referral Withdrawal Requests',
    'الأقسام': 'Sections',
    'المنتجات': 'Products',
    'المزودات': 'Providers',
    'مركز الاستيراد': 'Import Center',
    'الاشعارات': 'Notifications',
    'البانرات': 'Banners',
    'روابط التواصل': 'Social Links',
    'فيسبوك': 'Facebook',
    'إنستغرام': 'Instagram',
    'تلغرام': 'Telegram',
    'واتساب': 'WhatsApp',
    'رابط الدعم': 'Support Link',
    'حفظ الإعدادات': 'Save Settings',
};

function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function translateText(value, locale) {
    const text = normalize(value);
    if (!text) return value;
    if (locale !== 'en') return value;

    if (dictionary[text]) {
        return String(value).replace(text, dictionary[text]);
    }

    let translated = text;
    let changed = false;
    Object.entries(dictionary).forEach(([ar, en]) => {
        if (translated.includes(ar)) {
            translated = translated.split(ar).join(en);
            changed = true;
        }
    });

    return changed ? String(value).replace(text, translated) : value;
}

function shouldSkip(node) {
    const parent = node?.parentElement;
    if (!parent) return true;
    if (parent.closest('[data-no-auto-translate="true"], [data-no-global-edit="true"], input, textarea, select, option, script, style, svg, canvas')) {
        return true;
    }
    return false;
}

export default function AutoTranslator() {
    const { locale } = useSitePreferences();

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;

        const apply = () => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
                    const text = normalize(node.nodeValue);
                    return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                },
            });

            const nodes = [];
            let current = walker.nextNode();
            while (current) {
                nodes.push(current);
                current = walker.nextNode();
            }

            nodes.forEach((node) => {
                if (!originalTextMap.has(node)) {
                    originalTextMap.set(node, node.nodeValue);
                }

                const original = originalTextMap.get(node);
                node.nodeValue = locale === 'en' ? translateText(original, locale) : original;
            });
        };

        const frame = window.requestAnimationFrame(apply);
        const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });

        return () => {
            window.cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [locale]);

    return null;
}

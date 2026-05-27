import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useSitePreferences } from '@/lib/sitePreferences';

const docs = {
  terms: {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    introAr: 'باستخدامك منصة Sh7nle فأنت توافق على هذه الشروط المنظمة لعمليات الشحن والخدمات الرقمية.',
    introEn: 'By using Sh7nle, you agree to the terms governing top-ups and digital services.',
    itemsAr: [
      'يجب إدخال بيانات الطلب بدقة، مثل معرف اللاعب أو رقم الحساب أو السيرفر عند الحاجة.',
      'الطلبات المنفذة أو المسلمة رقمياً لا يمكن إلغاؤها بعد اكتمال التنفيذ إلا إذا ثبت وجود خطأ من المنصة أو المزود.',
      'قد تختلف مدة تنفيذ الطلب حسب المزود ونوع الخدمة وحالة الشبكة.',
      'يحق للمنصة تعليق الطلبات المشبوهة أو التي تحتوي بيانات غير صحيحة إلى حين المراجعة.',
      'الأسعار والتوفر قد تتغير حسب المزود، ويتم اعتماد السعر الظاهر لحظة تنفيذ الطلب.'
    ],
    itemsEn: [
      'Order details must be entered accurately, including player ID, account ID, or server when required.',
      'Delivered digital orders cannot be cancelled after completion unless an issue is confirmed by Sh7nle or the provider.',
      'Processing time may vary depending on the provider, service type, and network status.',
      'Suspicious or incorrect orders may be held for review.',
      'Prices and availability may change depending on the provider.'
    ]
  },
  privacy: {
    titleAr: 'سياسة الخصوصية',
    titleEn: 'Privacy Policy',
    introAr: 'نحافظ على خصوصية بياناتك ونستخدمها فقط لتشغيل الحساب وتنفيذ الطلبات وتحسين الخدمة.',
    introEn: 'We protect your privacy and use your data to operate your account, process orders, and improve the service.',
    itemsAr: [
      'نحفظ بيانات الحساب الأساسية مثل الاسم والبريد الإلكتروني وسجل الطلبات.',
      'لا نبيع بيانات المستخدمين لأطراف خارجية.',
      'قد نشارك بيانات الطلب الضرورية فقط مع المزود لتنفيذ الخدمة.',
      'نستخدم سجلات الأمان لحماية الحساب من الدخول غير المصرح به.',
      'يمكنك التواصل مع الدعم لطلب مراجعة بياناتك أو تحديثها.'
    ],
    itemsEn: [
      'We store basic account data such as name, email, and order history.',
      'We do not sell user data to third parties.',
      'Required order data may be shared with providers only to deliver the service.',
      'Security logs help protect accounts from unauthorized access.',
      'You can contact support to review or update your data.'
    ]
  },
  agreement: {
    titleAr: 'اتفاقية المستخدم',
    titleEn: 'User Agreement',
    introAr: 'هذه الاتفاقية توضح مسؤوليات المستخدم عند استخدام خدمات Sh7nle.',
    introEn: 'This agreement explains user responsibilities when using Sh7nle services.',
    itemsAr: [
      'يتحمل المستخدم مسؤولية صحة البيانات التي يرسلها عند إنشاء الطلب.',
      'يمنع استخدام المنصة لأي نشاط احتيالي أو مخالف للقوانين.',
      'رصيد الحساب يستخدم داخل المنصة ولا يعتبر حساباً بنكياً.',
      'قد يتم طلب توثيق إضافي للحساب عند الحاجة لحماية المستخدم والمنصة.',
      'استمرار استخدام المنصة يعني قبول التحديثات اللاحقة لهذه الاتفاقية.'
    ],
    itemsEn: [
      'The user is responsible for the accuracy of order information.',
      'The platform may not be used for fraud or illegal activity.',
      'Account balance is for use inside Sh7nle and is not a bank account.',
      'Additional verification may be requested when needed for security.',
      'Continued use means acceptance of future updates to this agreement.'
    ]
  }
};

export default function Legal({ type = 'terms' }) {
  const { isArabic } = useSitePreferences();
  const doc = docs[type] || docs.terms;
  const title = isArabic ? doc.titleAr : doc.titleEn;
  const intro = isArabic ? doc.introAr : doc.introEn;
  const items = isArabic ? doc.itemsAr : doc.itemsEn;

  return (
    <PublicLayout>
      <Head title={title}>
        <meta name="description" content={intro} />
      </Head>
      <section className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-black text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">Sh7nle</div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">{intro}</p>
        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-8 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

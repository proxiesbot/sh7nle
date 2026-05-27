import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useSitePreferences } from '@/lib/sitePreferences';

const docs = {
  terms: {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    lastUpdated: '2026-05-01',
    sectionsAr: [
      {
        heading: 'مقدمة',
        content: 'مرحباً بك في منصة شحنلي (Sh7nle) المتخصصة في خدمات الشحن الرقمي للألعاب والتطبيقات والاشتراكات. باستخدامك لهذه المنصة أو إنشاء حساب فيها، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام. نرجو قراءتها بعناية قبل استخدام أي من خدماتنا. في حال عدم موافقتك على أي بند من هذه الشروط، يرجى عدم استخدام المنصة.',
      },
      {
        heading: 'تعريف الخدمة',
        content: 'شحنلي هي منصة إلكترونية تتيح للمستخدمين شراء وشحن أرصدة الألعاب الإلكترونية، بطاقات الهدايا الرقمية، اشتراكات التطبيقات والبرامج، وحدات العملة داخل الألعاب (مثل UC، Diamonds، V-Bucks)، وبطاقات المتاجر الرقمية (Google Play، Apple، Steam وغيرها). جميع المنتجات المقدمة هي منتجات رقمية يتم تسليمها إلكترونياً.',
      },
      {
        heading: 'أهلية الاستخدام',
        items: [
          'يجب أن يكون عمرك 13 سنة على الأقل لاستخدام المنصة. إذا كان عمرك أقل من 18 سنة، فإنك تقر بأنك تستخدم المنصة بموافقة ولي أمرك.',
          'يجب أن تكون المعلومات المقدمة عند إنشاء الحساب صحيحة وحقيقية.',
          'كل مستخدم مسؤول عن الحفاظ على سرية بيانات حسابه وكلمة المرور الخاصة به.',
          'يحق للمنصة رفض تسجيل أي حساب أو تعليقه دون إبداء أسباب إذا اشتبهت بمخالفة الشروط.',
        ],
      },
      {
        heading: 'آلية الطلب والتنفيذ',
        items: [
          'عند إنشاء طلب شحن، يجب إدخال جميع البيانات المطلوبة بدقة تامة (معرف اللاعب، السيرفر، نوع الحساب، إلخ). أي خطأ في البيانات قد يؤدي لفقدان الرصيد دون إمكانية استرجاعه.',
          'بمجرد تأكيد الطلب ودفع المبلغ، يبدأ التنفيذ تلقائياً عبر المزودين المعتمدين. معظم الطلبات تُنفذ خلال ثوانٍ إلى دقائق قليلة.',
          'في حالات نادرة، قد يتأخر التنفيذ بسبب ضغط على خوادم المزود أو صيانة مؤقتة. سيتم إشعارك في حال وجود تأخير غير عادي.',
          'الطلبات المنفذة بنجاح والمسلمة رقمياً تُعتبر نهائية ولا يمكن إلغاؤها أو استرجاعها.',
          'في حال فشل التنفيذ لأسباب تقنية من جهتنا، يُعاد المبلغ تلقائياً إلى رصيدك في المنصة.',
        ],
      },
      {
        heading: 'الأسعار والدفع',
        items: [
          'جميع الأسعار المعروضة بالدولار الأمريكي ما لم يُذكر خلاف ذلك، وتشمل جميع الرسوم المطبقة.',
          'يحق للمنصة تعديل الأسعار في أي وقت دون إشعار مسبق. السعر المعتمد هو السعر الظاهر لحظة إتمام عملية الدفع.',
          'تتوفر عدة طرق دفع حسب المنطقة، وتخضع كل طريقة لشروطها الخاصة.',
          'رصيد المحفظة داخل المنصة هو رصيد افتراضي يُستخدم حصرياً لشراء الخدمات ولا يمكن تحويله إلى نقد أو سحبه خارج المنصة إلا عبر آليات محددة إن توفرت.',
        ],
      },
    ],
    sectionsEn: [
      {
        heading: 'Introduction',
        content: 'Welcome to Sh7nle, a digital top-up platform for games, apps, and subscriptions. By using this platform or creating an account, you agree to be bound by these terms and conditions. Please read them carefully before using any of our services. If you do not agree, please do not use the platform.',
      },
      {
        heading: 'Service Definition',
        content: 'Sh7nle is an online platform that allows users to purchase and top up game credits, digital gift cards, app and software subscriptions, in-game currencies (such as UC, Diamonds, V-Bucks), and digital store cards (Google Play, Apple, Steam, and more). All products are digital and delivered electronically.',
      },
      {
        heading: 'Eligibility',
        items: [
          'You must be at least 13 years old to use the platform. If under 18, you confirm that you are using it with parental consent.',
          'Information provided during registration must be accurate and truthful.',
          'Each user is responsible for maintaining the confidentiality of their account credentials.',
          'The platform reserves the right to refuse registration or suspend any account without stating reasons if a violation is suspected.',
        ],
      },
      {
        heading: 'Orders and Fulfillment',
        items: [
          'When placing an order, all required details (player ID, server, account type, etc.) must be entered accurately. Errors may result in irreversible loss of credit.',
          'Once an order is confirmed and paid, fulfillment begins automatically via authorized providers. Most orders are completed within seconds to a few minutes.',
          'In rare cases, delays may occur due to provider server load or temporary maintenance. You will be notified of any unusual delays.',
          'Successfully delivered digital orders are final and cannot be cancelled or refunded.',
          'If fulfillment fails due to a technical issue on our end, the amount is automatically refunded to your platform balance.',
        ],
      },
      {
        heading: 'Pricing and Payment',
        items: [
          'All prices are displayed in USD unless otherwise noted and include all applicable fees.',
          'The platform reserves the right to adjust prices at any time without prior notice. The applicable price is the one shown at the time of payment.',
          'Multiple payment methods are available depending on region, each subject to its own terms.',
          'Wallet balance is virtual credit used exclusively for purchasing services and cannot be withdrawn as cash unless specific mechanisms are available.',
        ],
      },
    ],
  },
  privacy: {
    titleAr: 'سياسة الخصوصية',
    titleEn: 'Privacy Policy',
    lastUpdated: '2026-05-01',
    sectionsAr: [
      {
        heading: 'نطاق السياسة',
        content: 'تشرح هذه السياسة كيفية جمع واستخدام وحماية بياناتك الشخصية عند استخدام منصة شحنلي. نحن نأخذ خصوصيتك بجدية ونلتزم بحماية معلوماتك وفق أفضل الممارسات والمعايير المتبعة في مجال أمن المعلومات.',
      },
      {
        heading: 'البيانات التي نجمعها',
        items: [
          'بيانات الحساب: الاسم الكامل، البريد الإلكتروني، رقم الهاتف (اختياري)، وكلمة المرور المشفرة.',
          'بيانات الطلبات: تفاصيل كل عملية شراء تشمل نوع المنتج، المبلغ، معرف اللاعب المُدخل، وتاريخ العملية.',
          'بيانات تقنية: عنوان IP، نوع المتصفح، نظام التشغيل، صفحات الموقع التي تمت زيارتها، ووقت الزيارة.',
          'بيانات المعاملات المالية: طريقة الدفع المستخدمة، مبلغ الإيداع، وحالة المعاملة. لا نحفظ بيانات البطاقة البنكية الكاملة.',
          'ملفات تعريف الارتباط (Cookies): نستخدمها لتحسين تجربة التصفح والحفاظ على جلسة تسجيل الدخول.',
        ],
      },
      {
        heading: 'كيف نستخدم بياناتك',
        items: [
          'تشغيل حسابك وتنفيذ الطلبات والتواصل معك بخصوص حالة طلباتك.',
          'تحسين تجربة الاستخدام وتطوير خدمات المنصة بناءً على أنماط الاستخدام العامة.',
          'حماية المنصة من الاحتيال والاستخدام غير المشروع عبر مراقبة الأنشطة المشبوهة.',
          'إرسال إشعارات مهمة تتعلق بحسابك أو بتحديثات الخدمة (يمكنك إلغاء الاشتراك بالإشعارات الترويجية).',
          'الامتثال للمتطلبات القانونية والتنظيمية عند الضرورة.',
        ],
      },
      {
        heading: 'مشاركة البيانات مع أطراف ثالثة',
        items: [
          'مزودو الخدمة: نشارك فقط البيانات الضرورية لتنفيذ طلبك (مثل معرف اللاعب) مع المزودين المعتمدين.',
          'بوابات الدفع: تتم معالجة المدفوعات عبر بوابات آمنة ومعتمدة ولا نحتفظ ببيانات بطاقتك.',
          'لا نبيع أو نؤجر أو نتاجر ببياناتك الشخصية مع أي طرف ثالث لأغراض تسويقية.',
          'قد نُفصح عن بياناتك إذا طُلب منا ذلك بموجب أمر قضائي أو إجراء قانوني ملزم.',
        ],
      },
      {
        heading: 'أمان البيانات',
        items: [
          'نستخدم تشفير SSL/TLS لحماية نقل البيانات بين جهازك وخوادمنا.',
          'كلمات المرور تُخزّن بتشفير أحادي الاتجاه (bcrypt) ولا يمكن لأحد الاطلاع عليها بما فيهم فريق العمل.',
          'نطبق صلاحيات وصول محددة بحيث لا يطلع على بياناتك إلا من يحتاج إليها لتقديم الخدمة.',
          'نجري مراجعات أمنية دورية ونحدّث أنظمتنا للحماية من الثغرات المكتشفة.',
          'رغم جهودنا، لا يمكن ضمان أمان مطلق عبر الإنترنت، لذا ننصحك باستخدام كلمة مرور قوية وعدم مشاركتها.',
        ],
      },
      {
        heading: 'حقوقك',
        items: [
          'يحق لك طلب نسخة من بياناتك الشخصية المحفوظة لدينا.',
          'يمكنك تحديث بياناتك أو تصحيحها في أي وقت من إعدادات حسابك.',
          'يحق لك طلب حذف حسابك وبياناتك مع مراعاة أننا قد نحتفظ ببعض السجلات لأغراض قانونية.',
          'يمكنك التواصل مع فريق الدعم لأي استفسار يتعلق بخصوصيتك عبر قنوات التواصل المتاحة.',
        ],
      },
    ],
    sectionsEn: [
      {
        heading: 'Scope',
        content: 'This policy explains how we collect, use, and protect your personal data when you use the Sh7nle platform. We take your privacy seriously and are committed to safeguarding your information following industry best practices.',
      },
      {
        heading: 'Data We Collect',
        items: [
          'Account data: full name, email address, phone number (optional), and encrypted password.',
          'Order data: details of each purchase including product type, amount, player ID entered, and transaction date.',
          'Technical data: IP address, browser type, operating system, pages visited, and visit duration.',
          'Financial data: payment method used, deposit amount, and transaction status. We do not store full card details.',
          'Cookies: used to improve browsing experience and maintain login sessions.',
        ],
      },
      {
        heading: 'How We Use Your Data',
        items: [
          'Operating your account, processing orders, and communicating about order status.',
          'Improving user experience and developing platform services based on general usage patterns.',
          'Protecting the platform from fraud and unauthorized use by monitoring suspicious activities.',
          'Sending important account or service update notifications (you can opt out of promotional messages).',
          'Complying with legal and regulatory requirements when necessary.',
        ],
      },
      {
        heading: 'Third-Party Sharing',
        items: [
          'Service providers: we share only data necessary to fulfill your order (e.g., player ID) with authorized providers.',
          'Payment gateways: payments are processed via secure certified gateways and we do not retain your card details.',
          'We never sell, rent, or trade your personal data with third parties for marketing purposes.',
          'We may disclose data if required by court order or binding legal process.',
        ],
      },
      {
        heading: 'Data Security',
        items: [
          'We use SSL/TLS encryption to protect data in transit between your device and our servers.',
          'Passwords are stored with one-way encryption (bcrypt) and cannot be viewed by anyone including staff.',
          'Access controls ensure that only authorized personnel can access necessary data to deliver the service.',
          'We conduct regular security reviews and update our systems to protect against newly discovered vulnerabilities.',
          'Despite our efforts, absolute security online cannot be guaranteed. We recommend using a strong unique password.',
        ],
      },
      {
        heading: 'Your Rights',
        items: [
          'You may request a copy of your personal data stored with us.',
          'You can update or correct your data at any time via account settings.',
          'You may request account and data deletion, noting that some records may be retained for legal purposes.',
          'Contact our support team for any privacy inquiries through available communication channels.',
        ],
      },
    ],
  },
  agreement: {
    titleAr: 'اتفاقية المستخدم',
    titleEn: 'User Agreement',
    lastUpdated: '2026-05-01',
    sectionsAr: [
      {
        heading: 'القبول والموافقة',
        content: 'بإنشائك حساباً في منصة شحنلي أو استخدامك لأي من خدماتها، فإنك تقر بأنك قرأت هذه الاتفاقية وفهمتها ووافقت على الالتزام بجميع بنودها. هذه الاتفاقية تمثل عقداً ملزماً بينك وبين المنصة.',
      },
      {
        heading: 'مسؤوليات المستخدم',
        items: [
          'أنت المسؤول الوحيد عن صحة ودقة البيانات التي تدخلها في أي طلب شحن أو شراء. المنصة غير مسؤولة عن الأخطاء الناتجة عن إدخال بيانات غير صحيحة.',
          'يجب استخدام المنصة فقط للأغراض المشروعة. يُمنع منعاً باتاً استخدامها في أي نشاط احتيالي أو غير قانوني أو ينتهك حقوق الآخرين.',
          'يُمنع محاولة الوصول غير المصرح به إلى حسابات مستخدمين آخرين أو أنظمة المنصة أو قواعد بياناتها.',
          'لا يجوز استخدام أدوات آلية (بوتات) للتفاعل مع المنصة دون إذن مسبق ومكتوب.',
          'يجب الإبلاغ فوراً عن أي نشاط مشبوه أو اختراق محتمل لحسابك عبر قنوات الدعم.',
        ],
      },
      {
        heading: 'الرصيد والمحفظة',
        items: [
          'رصيد المحفظة هو رصيد افتراضي داخل المنصة يُستخدم لشراء الخدمات والمنتجات الرقمية فقط.',
          'لا يعتبر رصيد المحفظة وديعة بنكية ولا يستحق فوائد أو أرباح.',
          'عمليات الإيداع تخضع للمراجعة وقد تتطلب وقتاً للتأكيد حسب طريقة الدفع.',
          'يحق للمنصة تجميد رصيد أي حساب يُشتبه بتورطه في أنشطة مخالفة إلى حين إتمام التحقيق.',
          'في حال إغلاق الحساب بسبب مخالفة الشروط، قد لا يكون الرصيد المتبقي قابلاً للاسترداد.',
        ],
      },
      {
        heading: 'حدود المسؤولية',
        items: [
          'المنصة تعمل كوسيط بين المستخدم ومزودي الخدمات الرقمية. لا نتحكم بشكل مباشر في توفر المنتجات لدى المزودين.',
          'لا تتحمل المنصة مسؤولية أي حظر أو إجراء يُتخذ ضد حساب اللاعب من قبل مطور اللعبة أو المنصة الأصلية.',
          'نبذل قصارى جهدنا لضمان استمرارية الخدمة، لكن لا نضمن عملها بشكل متواصل دون انقطاع.',
          'المنصة غير مسؤولة عن أي خسارة غير مباشرة أو ضرر تبعي ناتج عن استخدام خدماتنا.',
        ],
      },
      {
        heading: 'الإنهاء والتعليق',
        items: [
          'يحق لك إنهاء حسابك في أي وقت عبر التواصل مع فريق الدعم.',
          'يحق للمنصة تعليق أو إنهاء أي حساب يخالف هذه الاتفاقية فوراً ودون إنذار مسبق.',
          'في حالة التعليق، سيتم إشعارك بالسبب وقد تُتاح لك فرصة للطعن في القرار.',
          'تبقى البنود المتعلقة بالمسؤولية وحماية البيانات سارية حتى بعد إنهاء الحساب.',
        ],
      },
      {
        heading: 'التعديلات على الاتفاقية',
        content: 'نحتفظ بحق تعديل هذه الاتفاقية في أي وقت. سيتم إشعارك بالتعديلات الجوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة. استمرارك في استخدام المنصة بعد نشر التعديلات يعني موافقتك عليها. ننصحك بمراجعة هذه الصفحة بشكل دوري.',
      },
    ],
    sectionsEn: [
      {
        heading: 'Acceptance',
        content: 'By creating an account on Sh7nle or using any of its services, you acknowledge that you have read, understood, and agree to be bound by all terms of this agreement. This agreement constitutes a binding contract between you and the platform.',
      },
      {
        heading: 'User Responsibilities',
        items: [
          'You are solely responsible for the accuracy of data entered in any top-up or purchase order. The platform is not responsible for errors due to incorrect input.',
          'The platform must only be used for lawful purposes. Fraudulent, illegal, or rights-infringing activities are strictly prohibited.',
          'Unauthorized access attempts to other user accounts, platform systems, or databases are forbidden.',
          'Automated tools (bots) may not interact with the platform without prior written permission.',
          'Report any suspicious activity or potential account breach to support immediately.',
        ],
      },
      {
        heading: 'Balance and Wallet',
        items: [
          'Wallet balance is virtual credit within the platform used exclusively for purchasing digital services and products.',
          'Wallet balance is not a bank deposit and does not earn interest or profits.',
          'Deposits are subject to review and may require confirmation time depending on the payment method.',
          'The platform may freeze the balance of any account suspected of prohibited activities pending investigation.',
          'If an account is closed due to terms violation, remaining balance may not be refundable.',
        ],
      },
      {
        heading: 'Limitation of Liability',
        items: [
          'The platform acts as an intermediary between users and digital service providers. We do not directly control product availability from providers.',
          'The platform is not responsible for any ban or action taken against a player account by the game developer or original platform.',
          'We make every effort to ensure service continuity but do not guarantee uninterrupted operation.',
          'The platform is not liable for any indirect loss or consequential damage resulting from use of our services.',
        ],
      },
      {
        heading: 'Termination and Suspension',
        items: [
          'You may terminate your account at any time by contacting support.',
          'The platform may suspend or terminate any account that violates this agreement immediately without prior notice.',
          'In case of suspension, you will be notified of the reason and may be given an opportunity to appeal.',
          'Provisions relating to liability and data protection survive account termination.',
        ],
      },
      {
        heading: 'Agreement Modifications',
        content: 'We reserve the right to modify this agreement at any time. You will be notified of material changes via email or in-platform notification. Continued use of the platform after changes are published constitutes acceptance. We recommend reviewing this page periodically.',
      },
    ],
  },
};

export default function Legal({ type = 'terms' }) {
  const { isArabic } = useSitePreferences();
  const doc = docs[type] || docs.terms;
  const title = isArabic ? doc.titleAr : doc.titleEn;
  const sections = isArabic ? doc.sectionsAr : doc.sectionsEn;

  return (
    <PublicLayout>
      <Head title={title}>
        <meta name="description" content={sections[0]?.content || title} />
      </Head>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-black text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">Sh7nle</span>
            {doc.lastUpdated && (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {isArabic ? 'آخر تحديث:' : 'Last updated:'} {doc.lastUpdated}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
        </section>

        {sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-black text-white shadow-md">
                {sectionIndex + 1}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{section.heading}</h2>
            </div>

            {section.content && (
              <p className="text-sm leading-8 text-slate-600 dark:text-slate-300">{section.content}</p>
            )}

            {section.items && (
              <ul className="mt-3 space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                      {itemIndex + 1}
                    </span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}

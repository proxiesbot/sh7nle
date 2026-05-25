<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Deposit;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\ProviderSource;
use App\Models\Setting;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SystemAuditController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('System/Audit', [
            'generatedAt' => now()->toDateTimeString(),
            'summary' => $this->summary(),
            'groups' => [
                $this->financialChecks(),
                $this->ordersChecks(),
                $this->productsChecks(),
                $this->providersChecks(),
                $this->securityChecks(),
                $this->supportChecks(),
                $this->seoPerformanceChecks(),
            ],
        ]);
    }


    public function restoreSystemData(Request $request): RedirectResponse
    {
        Artisan::call('sh7nle:restore-system-data', ['--keep-tokens' => true]);

        return back()->with('success', 'تم تثبيت البيانات الأساسية للنظام: المزودات، طرق الدفع، Gift Cards، جوائز العجلة، والأدوار.');
    }

    protected function summary(): array
    {
        return [
            'users' => Schema::hasTable('users') ? User::query()->count() : 0,
            'cards' => Schema::hasTable('cards') ? Card::query()->count() : 0,
            'activeCards' => Schema::hasTable('cards') ? Card::query()->where('is_active', true)->count() : 0,
            'pendingOrders' => Schema::hasTable('payments') ? Payment::query()->whereIn('status', [0, 2])->count() : 0,
            'pendingDeposits' => Schema::hasTable('deposits') ? Deposit::query()->where('status', 0)->count() : 0,
            'openSupport' => Schema::hasTable('support_tickets') ? SupportTicket::query()->whereIn('status', ['open', 'live', 'answered'])->count() : 0,
        ];
    }

    protected function financialChecks(): array
    {
        $items = [];

        if (! Schema::hasTable('wallet_transactions')) {
            $items[] = $this->item('danger', 'سجل المحفظة', 'الجدول غير موجود', 'شغّل migrations قبل الاعتماد على النظام المالي.');
        } else {
            $last = WalletTransaction::query()->latest()->value('created_at');
            $items[] = $this->item('success', 'سجل المحفظة', WalletTransaction::query()->count().' حركة', $last ? 'آخر حركة: '.$last : 'لا توجد حركات بعد.');

            $negativeCredits = WalletTransaction::query()->where('direction', 'credit')->where('amount', '<=', 0)->count();
            $negativeDebits = WalletTransaction::query()->where('direction', 'debit')->where('amount', '<=', 0)->count();
            $items[] = $this->item(($negativeCredits + $negativeDebits) > 0 ? 'warning' : 'success', 'قيم الحركات المالية', ($negativeCredits + $negativeDebits).' حركة غير منطقية', 'أي حركة مالية يجب أن تكون قيمتها أكبر من صفر.');
        }

        if (Schema::hasTable('users')) {
            $negativeBalances = User::query()->where('balance', '<', 0)->count();
            $items[] = $this->item($negativeBalances > 0 ? 'danger' : 'success', 'أرصدة المستخدمين', $negativeBalances.' رصيد سالب', 'الرصيد السالب يحتاج مراجعة فورية.');
        }

        if (Schema::hasTable('deposits')) {
            $pendingDeposits = Deposit::query()->where('status', 0)->count();
            $items[] = $this->item($pendingDeposits > 0 ? 'warning' : 'success', 'الإيداعات المعلقة', $pendingDeposits.' طلب', 'راجع الإيداعات المعلقة بانتظام.');
        }

        return $this->group('المال والمحفظة', 'فحص الرصيد، الحركات المالية، والإيداعات.', $items);
    }

    protected function ordersChecks(): array
    {
        $items = [];

        if (! Schema::hasTable('payments')) {
            return $this->group('الطلبات', 'فحص الطلبات وحالاتها.', [$this->item('danger', 'جدول الطلبات', 'غير موجود', 'شغّل migrations.')]);
        }

        $nullOrderIds = Payment::query()->whereNull('orderId')->orWhere('orderId', '')->count();
        $items[] = $this->item($nullOrderIds > 0 ? 'danger' : 'success', 'معرّف الطلب', $nullOrderIds.' طلب بدون orderId', 'أي طلب بدون orderId ممكن يسبب خطأ SQL أو تتبع ضعيف.');

        $pending = Payment::query()->where('status', 0)->count();
        $failed = Payment::query()->where('status', 2)->count();
        $items[] = $this->item($pending > 0 ? 'warning' : 'success', 'الطلبات المعلقة', $pending.' طلب', 'راجع الطلبات المعلقة من لوحة الإدارة.');
        $items[] = $this->item($failed > 0 ? 'warning' : 'success', 'الطلبات الفاشلة', $failed.' طلب', 'تأكد من سياسة استرجاع الرصيد للطلبات الفاشلة.');

        $duplicates = DB::table('payments')
            ->select('orderId')
            ->whereNotNull('orderId')
            ->where('orderId', '<>', '')
            ->groupBy('orderId')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        $items[] = $this->item($duplicates > 0 ? 'warning' : 'success', 'تكرار orderId', $duplicates.' معرف مكرر', 'التكرار قد يكون طبيعيًا لبعض الطلبات الداخلية، لكنه يحتاج مراقبة.');

        return $this->group('الطلبات', 'فحص الطلبات وتكامل بياناتها.', $items);
    }

    protected function productsChecks(): array
    {
        if (! Schema::hasTable('cards')) {
            return $this->group('المنتجات', 'فحص المنتجات والمتجر.', [$this->item('danger', 'جدول المنتجات', 'غير موجود', 'شغّل migrations.')]);
        }

        $zeroPrice = Card::query()->where('is_active', true)->where(function ($query) {
            $query->whereNull('price')->orWhere('price', '<=', 0);
        })->count();

        $missingImages = Card::query()->where('is_active', true)->where(function ($query) {
            $query->whereNull('icon')->orWhere('icon', '');
        })->count();

        $unavailable = Card::query()
            ->where(function ($query) {
                $query->where('manual_unavailable', true)->orWhereNotNull('provider_unavailable_at');
            })
            ->count();

        $activeWithoutSection = Card::query()->where('is_active', true)->where(function ($query) {
            $query->whereNull('section_id')->orWhere('section_id', 0);
        })->count();

        return $this->group('المنتجات والمتجر', 'فحص ظهور المنتجات، الصور، الأسعار، والتوفر.', [
            $this->item($zeroPrice > 0 ? 'danger' : 'success', 'منتجات بدون سعر', $zeroPrice.' منتج', 'أي منتج فعال بدون سعر لن يكون جاهزًا للبيع.'),
            $this->item($missingImages > 0 ? 'warning' : 'success', 'صور المنتجات', $missingImages.' منتج بدون صورة', 'إضافة الصور تحسن سرعة القرار وتجربة الزبون.'),
            $this->item($unavailable > 0 ? 'warning' : 'success', 'منتجات غير متوفرة', $unavailable.' منتج', 'راجع المنتجات غير المتوفرة من المتجر أو لوحة الإدارة.'),
            $this->item($activeWithoutSection > 0 ? 'warning' : 'success', 'ربط الأقسام', $activeWithoutSection.' منتج بدون قسم', 'المنتج بدون قسم قد لا يظهر في المتجر.'),
        ]);
    }

    protected function providersChecks(): array
    {
        if (! Schema::hasTable('provider_sources')) {
            return $this->group('المزودات', 'فحص شمس و SW Games.', [$this->item('warning', 'المزودات', 'غير مفعلة', 'جدول المزودات غير موجود.')]);
        }

        $active = ProviderSource::query()->where('is_active', true)->count();
        $missingBaseUrl = ProviderSource::query()->where('is_active', true)->where(function ($query) {
            $query->whereNull('base_url')->orWhere('base_url', '');
        })->count();
        $missingToken = ProviderSource::query()->where('is_active', true)->where(function ($query) {
            $query->whereNull('api_token')->orWhere('api_token', '');
        })->count();

        return $this->group('المزودات', 'فحص جاهزية مزودات المنتجات.', [
            $this->item($active > 0 ? 'success' : 'warning', 'المزودات النشطة', $active.' مزود', 'لازم يكون مزود واحد على الأقل فعال.'),
            $this->item($missingBaseUrl > 0 ? 'danger' : 'success', 'Base URL', $missingBaseUrl.' مزود ناقص', 'المزود النشط يحتاج Base URL صحيح.'),
            $this->item($missingToken > 0 ? 'warning' : 'success', 'API Token', $missingToken.' مزود ناقص', 'بعض المزودات تحتاج توكن قبل الاستيراد أو تنفيذ الطلبات.'),
        ]);
    }

    protected function securityChecks(): array
    {
        $mailReady = filled(config('mail.from.address')) && filled(config('mail.mailers.smtp.host')) && filled(config('mail.mailers.smtp.username'));
        $backupEnabled = (bool) Setting::get('backup.telegram_enabled', false);
        $backupConfigured = filled(Setting::get('backup.telegram_bot_token', '')) && filled(Setting::get('backup.telegram_chat_id', ''));

        $adminCount = Schema::hasTable('model_has_roles') && Schema::hasTable('roles')
            ? User::query()->whereHas('roles', fn ($query) => $query->whereIn('name', ['Super-Admin', 'superadmin', 'admin', 'Admin']))->count()
            : 0;

        return $this->group('الأمان والتجهيز', 'فحص البريد، النسخ الاحتياطي، وصلاحيات الإدارة.', [
            $this->item($adminCount > 0 ? 'success' : 'danger', 'حسابات الإدارة', $adminCount.' حساب', 'لازم يكون في حساب إدارة واحد على الأقل.'),
            $this->item($mailReady ? 'success' : 'warning', 'إعدادات البريد', $mailReady ? 'جاهزة' : 'ناقصة', 'البريد مطلوب لتأكيد الحساب وتنبيهات الأمان واستعادة كلمة المرور.'),
            $this->item(($backupEnabled && $backupConfigured) ? 'success' : 'warning', 'نسخ قاعدة البيانات', ($backupEnabled && $backupConfigured) ? 'مفعل' : 'غير مكتمل', 'فعّل النسخ اليومي إلى تلغرام من إعدادات المتجر ثم أضف Cron Job.'),
        ]);
    }

    protected function supportChecks(): array
    {
        if (! Schema::hasTable('support_tickets')) {
            return $this->group('الدعم', 'فحص الدردشة والتذاكر.', [$this->item('warning', 'الدعم', 'غير مفعّل', 'جداول الدعم غير موجودة.')]);
        }

        $open = SupportTicket::query()->whereIn('status', ['open', 'live'])->count();
        $answered = SupportTicket::query()->where('status', 'answered')->count();
        $closed = SupportTicket::query()->where('status', 'closed')->count();

        return $this->group('الدعم والدردشة', 'فحص حالة التذاكر والدردشة.', [
            $this->item($open > 0 ? 'warning' : 'success', 'تذاكر مفتوحة', $open.' تذكرة', 'تذاكر open/live تحتاج رد سريع.'),
            $this->item($answered > 0 ? 'success' : 'neutral', 'تذاكر تم الرد عليها', $answered.' تذكرة', 'تظهر للمتابعة مع الزبون.'),
            $this->item('neutral', 'تذاكر مغلقة', $closed.' تذكرة', 'الأرشيف مفيد للمراجعة.'),
        ]);
    }

    protected function seoPerformanceChecks(): array
    {
        $sitemapReady = true;
        $activeSections = Schema::hasTable('sections') ? DB::table('sections')->where('section_id', 0)->count() : 0;
        $activeCards = Schema::hasTable('cards') ? Card::query()->where('is_active', true)->count() : 0;

        return $this->group('SEO والسرعة', 'فحص أساسيات الظهور وسرعة التصفح.', [
            $this->item($sitemapReady ? 'success' : 'warning', 'Sitemap', 'جاهز', 'تم إضافة sitemap.xml و robots.txt.'),
            $this->item($activeSections > 0 ? 'success' : 'warning', 'الأقسام الرئيسية', $activeSections.' قسم', 'الأقسام الرئيسية تساعد SEO والتنقل.'),
            $this->item($activeCards > 0 ? 'success' : 'warning', 'المنتجات الفعالة', $activeCards.' منتج', 'المنتجات الفعالة تظهر في المتجر وتحسن المحتوى.'),
        ]);
    }

    protected function group(string $title, string $description, array $items): array
    {
        $score = collect($items)->contains(fn ($item) => $item['level'] === 'danger') ? 'danger'
            : (collect($items)->contains(fn ($item) => $item['level'] === 'warning') ? 'warning' : 'success');

        return compact('title', 'description', 'items', 'score');
    }

    protected function item(string $level, string $label, string $value, string $hint): array
    {
        return compact('level', 'label', 'value', 'hint');
    }
}

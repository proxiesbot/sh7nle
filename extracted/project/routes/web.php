<?php

use App\Http\Controllers\BannerController;
use App\Http\Controllers\ContentTextController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\RedeemCodeController;
use App\Http\Controllers\ReferralWithdrawalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProviderSourceController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ApiDocsController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\ImportedProviderProductController;
use App\Http\Controllers\SubcategoryController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\GiftCardController;
use App\Http\Controllers\FortuneWheelController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SystemAuditController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
})->name('csrf.token');

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'not_blocked',
    'role:Super-Admin|admin',
])->group(function () {
    Route::get('admin/reports', [ReportController::class, 'dashboard'])->name('reports.dashboard');
    Route::get('admin/system-audit', [SystemAuditController::class, 'index'])->name('system.audit.index');
    Route::post('admin/system-audit/restore-system-data', [SystemAuditController::class, 'restoreSystemData'])->name('system.audit.restoreSystemData');
    Route::post('admin/content-texts', [ContentTextController::class, 'update'])->name('contentTexts.update');
    Route::get('admin/support-tickets', [SupportTicketController::class, 'adminIndex'])->name('support.admin.index');
    Route::get('admin/support-tickets/{ticket}', [SupportTicketController::class, 'show'])->name('support.admin.show');
    Route::post('admin/support-tickets/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('support.admin.reply');
    Route::post('admin/support-tickets/{ticket}/close', [SupportTicketController::class, 'close'])->name('support.admin.close');
    Route::get('admin/wallet-transactions', [WalletController::class, 'adminIndex'])->name('wallet.admin.index');
    Route::get('admin/wheel', [FortuneWheelController::class, 'admin'])->name('wheel.admin');
    Route::post('admin/users/{user}/wheel-spins/grant', [FortuneWheelController::class, 'grantSpins'])->name('wheel.admin.grant');
    Route::post('admin/users/{user}/wheel-spins/remove', [FortuneWheelController::class, 'removeSpins'])->name('wheel.admin.remove');
    Route::post('admin/users/{user}/wheel-spins/set', [FortuneWheelController::class, 'setSpins'])->name('wheel.admin.set');
    Route::get('admin/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::post('admin/settings', [SettingController::class, 'update'])->name('settings.update');
    Route::resource('providerSources', ProviderSourceController::class)->except('show');
    Route::post('cards/{card}/quick-price', [CardController::class, 'quickUpdatePrice'])->name('cards.quickPrice');
    Route::post('cards/{card}/quick-image', [CardController::class, 'quickUpdateImage'])->name('cards.quickImage');
    Route::post('cards/{card}/quick-availability', [CardController::class, 'quickToggleAvailability'])->name('cards.quickAvailability');

    Route::get('admin/imported-products', [ImportedProviderProductController::class, 'index'])->name('importedProducts.index');
    Route::get('admin/imported-products/sync', [ImportedProviderProductController::class, 'sync'])->name('importedProducts.sync');
    Route::post('admin/imported-products/import-remote', [ImportedProviderProductController::class, 'importRemote'])->name('importedProducts.importRemote');
    Route::post('admin/imported-products/import-selected', [ImportedProviderProductController::class, 'importSelectedRemoteProducts'])->name('importedProducts.importSelected');
    Route::post('admin/imported-products/import-remote-category', [ImportedProviderProductController::class, 'importRemoteCategory'])->name('importedProducts.importRemoteCategory');
    Route::post('admin/imported-products/import-all/start', [ImportedProviderProductController::class, 'startAllProvidersImport'])->name('importedProducts.importAll.start');
    Route::post('admin/imported-products/import-all/process', [ImportedProviderProductController::class, 'processAllProvidersImport'])->name('importedProducts.importAll.process');
    Route::post('admin/imported-products/scan-category/start', [ImportedProviderProductController::class, 'startCategoryScan'])->name('importedProducts.scanCategory.start');
    Route::post('admin/imported-products/scan-category/process', [ImportedProviderProductController::class, 'processCategoryScan'])->name('importedProducts.scanCategory.process');
    Route::post('admin/imported-products/import-remote-category/start', [ImportedProviderProductController::class, 'startCategoryImport'])->name('importedProducts.importRemoteCategory.start');
    Route::post('admin/imported-products/import-remote-category/process', [ImportedProviderProductController::class, 'processCategoryImport'])->name('importedProducts.importRemoteCategory.process');
    Route::get('admin/imported-products/import-remote-category/progress', [ImportedProviderProductController::class, 'importProgress'])->name('importedProducts.importRemoteCategory.progress');
    Route::post('admin/imported-products/{importedProduct}/publish', [ImportedProviderProductController::class, 'publish'])->name('importedProducts.publish');

    Route::get('users', [UserController::class, 'index'])->name('user.index');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
    Route::post('users/{user}', [UserController::class, 'update'])->name('user.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('user.destroy');

    Route::resource('deposit', DepositController::class)->except('create', 'store');

    Route::post('paymentMethods/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('paymentMethods.update');
    Route::resource('paymentMethods', PaymentMethodController::class)->except('update');

    Route::resource('payment', PaymentController::class);

    Route::get('banners', [BannerController::class, 'index'])->name('banners.index');
    Route::get('banners/create', [BannerController::class, 'create'])->name('banners.create');
    Route::post('banners', [BannerController::class, 'store'])->name('banners.store');
    Route::get('banners/{banner}/edit', [BannerController::class, 'edit'])->name('banners.edit');
    Route::post('banners/{banner}', [BannerController::class, 'update'])->name('banners.update');
    Route::delete('banners/{banner}', [BannerController::class, 'destroy'])->name('banners.destroy');

    Route::get('referral-withdrawals', [ReferralWithdrawalController::class, 'index'])->name('referralWithdrawals.index');
    Route::post('referral-withdrawals/{referralWithdrawal}/status', [ReferralWithdrawalController::class, 'updateStatus'])->name('referralWithdrawals.updateStatus');

    Route::get('sections/{section}/subSection/create', [SectionController::class, 'createSubSection'])->name('sections.subSection.create');
    Route::get('sections/{section}/card/create', [SectionController::class, 'createCard'])->name('sections.card.create');
    Route::get('admin/sections/{section}/manage', [SectionController::class, 'manage'])->name('sections.manage');
    Route::post('sections/{section}', [SectionController::class, 'update'])->name('sections.update');
    Route::get('admin/sections', [SectionController::class, 'adminIndex'])->name('sections.indexAdmin');
    Route::resource('sections', SectionController::class)->except('index', 'show', 'update');

    Route::post('category/{category}', [CategoryController::class, 'update'])->name('category.update');
    Route::get('category/{category}/addSubcategory', [CategoryController::class, 'addSubcategory'])->name('category.addSubcategory');
    Route::resource('category', CategoryController::class)->except('index', 'update');

    Route::get('subcategory/{subcategory}/addCard', [SubcategoryController::class, 'addCard'])->name('subcategory.addCard');
    Route::post('subcategory/{subcategory}', [SubcategoryController::class, 'update'])->name('subcategory.update');
    Route::resource('subcategory', SubcategoryController::class)->except('update');

    Route::get('card/provider-preview', [CardController::class, 'providerPreview'])->name('card.providerPreview');
    Route::get('card/provider-catalog', [CardController::class, 'providerCatalog'])->name('card.providerCatalog');
    Route::post('card/{card}/quick-pricing', [CardController::class, 'quickUpdatePricing'])->name('card.quickPricing');
    Route::post('card/{card}/quick-sort', [CardController::class, 'quickUpdateSort'])->name('card.quickSort');
    Route::post('card/{card}/move-section', [CardController::class, 'moveSection'])->name('card.moveSection');
    Route::post('card/{card}', [CardController::class, 'update'])->name('card.update');
    Route::resource('card', CardController::class)->except('update');

    Route::post('notification/{notification}', [NotificationController::class, 'update'])->name('notification.update');
    Route::resource('notification', NotificationController::class)->except('update');
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'not_blocked',
    'role:Super-Admin|admin|Seller',
])->group(function () {
    Route::get('user/transferMoney', [UserController::class, 'showTransferMoneyPage'])->name('user.transferMoneyPage');
    Route::post('user/transferMoney', [UserController::class, 'transferMoney'])->name('user.transferMoney');

    Route::post('deposits/{deposit}/updateStatus', [DepositController::class, 'updateStatus'])->name('deposits.updateStatus');
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'not_blocked',
])->group(function () {
    Route::get('user/{user}/payments', [UserController::class, 'userPayments'])->name('user.payments');
    Route::post('user/{user}/buyCard', [UserController::class, 'buyCard'])->name('user.buyCard');
    Route::get('user/{user}/deposits', [UserController::class, 'userDeposits'])->name('user.deposits');
    Route::get('user/{user}/notifications', [UserController::class, 'userNotifications'])->name('user.notifications');
    Route::get('wallet', [WalletController::class, 'index'])->name('wallet.index');
    Route::get('referrals', [UserController::class, 'referrals'])->name('referrals.index');
    Route::get('gift-card/redeem', [GiftCardController::class, 'redeemPage'])->name('giftCards.redeemPage');
    Route::post('gift-card/redeem', [GiftCardController::class, 'redeem'])->name('giftCards.redeem');
    Route::get('fortune-wheel', [FortuneWheelController::class, 'index'])->name('wheel.index');
    Route::post('fortune-wheel/spin', [FortuneWheelController::class, 'spin'])->name('wheel.spin');
    Route::get('support-tickets', [SupportTicketController::class, 'userIndex'])->name('support.index');
    Route::post('support-tickets', [SupportTicketController::class, 'store'])->name('support.store');
    Route::get('support-tickets/{ticket}', [SupportTicketController::class, 'show'])->name('support.show');
    Route::post('support-tickets/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('support.reply');
    Route::post('referral-withdrawals', [ReferralWithdrawalController::class, 'store'])->name('referralWithdrawals.store');

    Route::get('deposits/create', [DepositController::class, 'create'])->name('deposit.create');
    Route::post('deposit', [DepositController::class, 'store'])->name('deposit.store');
    Route::post('deposits/createPaymentLink', [DepositController::class, 'createPaymentLink'])->name('deposit.createPaymentLink');
    Route::get('deposit/callback', [DepositController::class, 'depositCallback'])->name('deposit.callback');

    Route::get('redeem-code', [RedeemCodeController::class, 'show'])->name('redeemCode.show');
    Route::post('redeem-code', [RedeemCodeController::class, 'redeem'])->name('redeemCode.redeem');

    Route::resource('category', CategoryController::class)->only('index');

    Route::get('/dashboard', function () {
        return redirect()->route('sections.main');
    })->name('dashboard');

    Route::get('/account', [UserController::class, 'account'])->name('account');
    Route::post('/account/profile', [UserController::class, 'updateAccountProfile'])->name('account.profile.update');
    Route::post('/account/password', [UserController::class, 'updateAccountPassword'])->name('account.password.update');
    Route::get('/account/api', [ApiDocsController::class, 'show'])->name('account.api');
});


Route::get('terms', fn () => Inertia::render('Legal', ['type' => 'terms']))->name('legal.terms');
Route::get('privacy', fn () => Inertia::render('Legal', ['type' => 'privacy']))->name('legal.privacy');
Route::get('user-agreement', fn () => Inertia::render('Legal', ['type' => 'agreement']))->name('legal.agreement');

Route::get('sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('robots.txt', [SeoController::class, 'robots'])->name('seo.robots');

Route::get('/', function () {
    return redirect()->route('sections.main');
});

Route::get('/welcome', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('main', [SectionController::class, 'main'])->name('sections.main');
Route::get('sections/{section}', [SectionController::class, 'getChildren'])->name('sections.show');
Route::get('sections', [SectionController::class, 'index'])->name('sections.index');

Route::get('auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('auth/google/callback', [GoogleAuthController::class, 'googleCallback'])->name('auth.google.callback');
Route::redirect('google/auth/alias', 'auth/google')->name('google.auth.alias');

Route::get('category/{category}/getSubcategories', [CategoryController::class, 'getSubcategories'])->name('category.getSubcategories');
Route::get('subcategory/{subcategory}/getCards', [SubcategoryController::class, 'getCards'])->name('subcategory.getCards');

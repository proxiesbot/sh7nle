<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Card;
use App\Models\Deposit;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\ReferralWithdrawal;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function dashboard(): Response
    {
        $successfulPayments = Payment::query()->where('status', 1);
        $approvedDeposits = Deposit::query()->where('status', 1);
        $approvedReferralWithdrawals = ReferralWithdrawal::query()->whereIn('status', [1, 3]);

        $sales = round((float) $successfulPayments->sum('price'), 2);
        $cost = round((float) $successfulPayments->sum('cost_price'), 2);
        $profit = round((float) $successfulPayments->sum('profit_amount'), 2);
        $referralCommission = round((float) $successfulPayments->sum('referral_commission_amount'), 2);
        $netProfit = round($profit - $referralCommission, 2);

        $summary = [
            'sales' => $sales,
            'cost' => $cost,
            'profit' => $profit,
            'netProfit' => $netProfit,
            'referralCommission' => $referralCommission,
            'deposits' => round((float) $approvedDeposits->sum('amount'), 2),
            'users' => User::query()->count(),
            'sellers' => User::role('Seller')->count(),
            'orders' => Payment::query()->count(),
            'successfulOrders' => Payment::query()->where('status', 1)->count(),
            'pendingOrders' => Payment::query()->where('status', 0)->count(),
            'pendingDeposits' => Deposit::query()->where('status', 0)->count(),
            'manualDeposits' => Deposit::query()->whereHas('paymentMethod', fn ($query) => $query->where('is_automatic', false))->count(),
            'automaticDeposits' => Deposit::query()->whereHas('paymentMethod', fn ($query) => $query->where('is_automatic', true))->count(),
            'pendingReferralWithdrawals' => ReferralWithdrawal::query()->where('status', 0)->count(),
            'approvedReferralWithdrawals' => $approvedReferralWithdrawals->count(),
            'paidReferralWithdrawalsAmount' => round((float) ReferralWithdrawal::query()->where('status', 3)->sum('amount'), 2),
            'averageMargin' => $sales > 0 ? round(($profit / $sales) * 100, 2) : 0,
        ];

        $cards = Card::query()
            ->leftJoin('payments', 'payments.card_id', '=', 'cards.id')
            ->select('cards.id', 'cards.name', 'cards.price', 'cards.cost_price', 'cards.provider_cost_price', 'cards.price_adjustment_percentage', 'cards.profit_percentage')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.amount ELSE 0 END), 0) as sold_units')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.price ELSE 0 END), 0) as revenue')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.cost_price ELSE 0 END), 0) as total_cost')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.profit_amount ELSE 0 END), 0) as total_profit')
            ->groupBy('cards.id', 'cards.name', 'cards.price', 'cards.cost_price', 'cards.provider_cost_price', 'cards.price_adjustment_percentage', 'cards.profit_percentage')
            ->orderByDesc('total_profit')
            ->limit(15)
            ->get();

        $topCustomers = User::query()
            ->leftJoin('payments', 'payments.user_id', '=', 'users.id')
            ->leftJoin('deposits', function ($join) {
                $join->on('deposits.user_id', '=', 'users.id')->where('deposits.status', '=', 1);
            })
            ->select('users.id', 'users.name', 'users.email', 'users.special_price_discount_percentage', 'users.referral_rate_percentage')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.price ELSE 0 END), 0) as spent')
            ->selectRaw('COALESCE(SUM(CASE WHEN payments.status = 1 THEN payments.profit_amount ELSE 0 END), 0) as profit')
            ->selectRaw('COALESCE(SUM(CASE WHEN deposits.status = 1 THEN deposits.amount ELSE 0 END), 0) as deposited')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.special_price_discount_percentage', 'users.referral_rate_percentage')
            ->orderByDesc('spent')
            ->limit(12)
            ->get();

        $topReferrers = User::query()
            ->withCount('referrals')
            ->orderByDesc('total_referral_earnings')
            ->limit(10)
            ->get(['id', 'name', 'email', 'referral_code', 'referral_balance', 'total_referral_earnings', 'referral_rate_percentage']);

        $paymentMethodBreakdown = PaymentMethod::query()
            ->withCount(['deposits as deposits_count'])
            ->get()
            ->map(function (PaymentMethod $method) {
                $deposits = Deposit::query()->where('payment_method_id', $method->id);

                return [
                    'id' => $method->id,
                    'name' => $method->name,
                    'provider' => $method->provider,
                    'is_automatic' => $method->is_automatic,
                    'deposits_count' => (int) $method->deposits_count,
                    'approved_amount' => round((float) (clone $deposits)->where('status', 1)->sum('amount'), 2),
                    'pending_count' => (clone $deposits)->where('status', 0)->count(),
                ];
            })
            ->sortByDesc('approved_amount')
            ->values();

        return Inertia::render('Reports/Dashboard', [
            'summary' => $summary,
            'cards' => $cards,
            'topCustomers' => $topCustomers,
            'topReferrers' => $topReferrers,
            'paymentMethodBreakdown' => $paymentMethodBreakdown,
            'recentPayments' => Payment::query()->with('user', 'card')->latest()->limit(10)->get(),
            'recentDeposits' => Deposit::query()->with('user', 'paymentMethod')->latest()->limit(10)->get(),
            'recentBanners' => Banner::query()->latest()->limit(5)->get(['id', 'title', 'is_active', 'sort_order', 'created_at']),
        ]);
    }
}

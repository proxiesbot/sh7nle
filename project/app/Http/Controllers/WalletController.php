<?php

namespace App\Http\Controllers;

use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function index(Request $request): Response
    {
        $transactions = Schema::hasTable('wallet_transactions')
            ? WalletTransaction::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate(20)
            : new LengthAwarePaginator([], 0, 20);

        return Inertia::render('Wallet/Index', [
            'transactions' => $transactions,
        ]);
    }

    public function adminIndex(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'direction' => trim((string) $request->query('direction', '')),
            'type' => trim((string) $request->query('type', '')),
            'date_from' => trim((string) $request->query('date_from', '')),
            'date_to' => trim((string) $request->query('date_to', '')),
        ];

        if (! Schema::hasTable('wallet_transactions')) {
            return Inertia::render('Wallet/Admin', [
                'transactions' => new LengthAwarePaginator([], 0, 30),
                'filters' => $filters,
                'stats' => ['credits' => 0, 'debits' => 0, 'net' => 0, 'count' => 0],
                'types' => [],
            ]);
        }

        $baseQuery = WalletTransaction::query()
            ->with(['user:id,name,email,balance', 'admin:id,name,email'])
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = $filters['search'];
                $query->where(function ($inner) use ($search) {
                    $inner->where('description', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhere('reference_id', $search)
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('id', $search);
                        });
                });
            })
            ->when(in_array($filters['direction'], ['credit', 'debit'], true), fn ($query) => $query->where('direction', $filters['direction']))
            ->when($filters['type'] !== '', fn ($query) => $query->where('type', $filters['type']))
            ->when($filters['date_from'] !== '', fn ($query) => $query->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn ($query) => $query->whereDate('created_at', '<=', $filters['date_to']));

        $statsQuery = clone $baseQuery;
        $credits = (float) (clone $statsQuery)->where('direction', 'credit')->sum('amount');
        $debits = (float) (clone $baseQuery)->where('direction', 'debit')->sum('amount');
        $count = (clone $baseQuery)->count();

        return Inertia::render('Wallet/Admin', [
            'transactions' => $baseQuery->latest()->paginate(30)->withQueryString(),
            'filters' => $filters,
            'stats' => [
                'credits' => round($credits, 8),
                'debits' => round($debits, 8),
                'net' => round($credits - $debits, 8),
                'count' => $count,
            ],
            'types' => WalletTransaction::query()->select('type')->distinct()->orderBy('type')->pluck('type')->filter()->values(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles simple page routes that were previously Closures.
 * Extracted to allow php artisan route:cache to work.
 */
class PageController extends Controller
{
    public function csrfToken(): JsonResponse
    {
        return response()->json(['token' => csrf_token()]);
    }

    public function dashboard(): RedirectResponse
    {
        return redirect()->route('sections.main');
    }

    public function home(): RedirectResponse
    {
        return redirect()->route('sections.main');
    }

    public function welcome(): Response
    {
        return Inertia::render('Welcome');
    }

    public function about(): Response
    {
        return Inertia::render('About');
    }

    public function terms(): Response
    {
        return Inertia::render('Legal', ['type' => 'terms']);
    }

    public function privacy(): Response
    {
        return Inertia::render('Legal', ['type' => 'privacy']);
    }

    public function userAgreement(): Response
    {
        return Inertia::render('Legal', ['type' => 'agreement']);
    }
}

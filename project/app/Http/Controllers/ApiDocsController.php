<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiDocsController extends Controller
{
    public function show(Request $request): Response
    {
        abort_unless($request->user()?->api_enabled, 403);

        return Inertia::render('Api/Docs', [
            'apiToken' => $request->user()->api_token,
            'baseUrl' => url('/api/reseller'),
            'user' => $request->user()->only(['name', 'email', 'customer_level']),
        ]);
    }
}

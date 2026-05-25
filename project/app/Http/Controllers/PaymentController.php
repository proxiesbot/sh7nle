<?php

namespace App\Http\Controllers;

use App\Http\Utility\PaymentUtility;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Display admin listing of all payments/orders.
     */
    public function index()
    {
        return Inertia::render('Payment/IndexAdmin', [
            'payments' => Payment::with('user', 'card')->latest()->paginate(10),
        ]);
    }
}

<?php

use App\Http\Controllers\DepositController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResellerApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-2fa', [AuthController::class, 'verify2FA']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Webhook route (no auth required)
Route::post('deposit/webhook', [DepositController::class, 'depositWebhook'])->middleware('throttle:30,1')->name('deposit.webhook');


Route::middleware('reseller_api')->prefix('reseller')->group(function () {
    Route::get('/profile', [ResellerApiController::class, 'profile']);
    Route::get('/products', [ResellerApiController::class, 'products']);
    Route::get('/products/{card}', [ResellerApiController::class, 'showProduct']);
    Route::get('/orders', [ResellerApiController::class, 'orders']);
    Route::post('/orders', [ResellerApiController::class, 'createOrder']);
});

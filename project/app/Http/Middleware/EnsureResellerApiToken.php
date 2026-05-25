<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EnsureResellerApiToken
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken() ?: $request->header('X-Api-Token');
        if (! $token) {
            return response()->json(['message' => 'مطلوب توكن API للوصول.'], 401);
        }

        // Hybrid lookup: try plain-text match first (legacy), then hashed match.
        // TODO: After all users regenerate tokens, remove plain-text fallback.
        $user = User::query()->where('api_token', $token)->where('api_enabled', true)->first();

        if (! $user) {
            // Fallback: check hashed tokens for users who regenerated after the security update
            $user = User::query()
                ->where('api_enabled', true)
                ->whereNotNull('api_token_hash')
                ->get(['id', 'api_token_hash', 'api_enabled'])
                ->first(fn ($candidate) => Hash::check($token, $candidate->api_token_hash));
        }

        if (! $user) {
            return response()->json(['message' => 'توكن API غير صالح.'], 401);
        }

        // Reload full user model for the request
        if (! $user->relationLoaded('roles')) {
            $user = User::query()->findOrFail($user->id);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}


<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        // Set session flash to show 2FA setup modal for newly registered users
        session()->flash('show_2fa_prompt', true);
        session()->flash('is_new_user', true);
        
        return $request->wantsJson()
            ? response()->json(['two_factor_enabled' => false])
            : redirect()->intended(config('fortify.home'));
    }
}

<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Jetstream\Jetstream;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => $this->passwordRules(),
            'referral_code' => ['nullable', 'string', 'exists:users,referral_code'],
            'terms' => Jetstream::hasTermsAndPrivacyPolicyFeature() ? ['accepted', 'required'] : '',
        ])->validate();

        $referrerId = null;
        if (! empty($input['referral_code'])) {
            $referrerId = User::query()->where('referral_code', $input['referral_code'])->value('id');
        }

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
            'referred_by_user_id' => $referrerId,
            'referral_code' => $this->generateReferralCode(),
        ]);

        $role = Role::query()->firstOrCreate(
            ['name' => 'Normal', 'guard_name' => 'web'],
            ['name' => 'Normal', 'guard_name' => 'web']
        );

        if (! $user->hasRole($role->name)) {
            $user->assignRole($role->name);
        }

        return $user;
    }

    protected function generateReferralCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (User::query()->where('referral_code', $code)->exists());

        return $code;
    }
}

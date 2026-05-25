<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        // create permissions
        Permission::firstOrCreate(['name' => 'edit articles']);
        Permission::firstOrCreate(['name' => 'delete articles']);
        Permission::firstOrCreate(['name' => 'publish articles']);
        Permission::firstOrCreate(['name' => 'unpublish articles']);
        Permission::firstOrCreate(['name' => 'add location']);
        Permission::firstOrCreate(['name' => 'remove location']);
        Permission::firstOrCreate(['name' => 'edit location']);
        Permission::firstOrCreate(['name' => 'transfer money']);

        // create roles and assign existing permissions
        $role1 = Role::firstOrCreate(['name' => 'admin']);
        $role1->givePermissionTo('publish articles');
        $role1->givePermissionTo('unpublish articles');

        $role2 = Role::firstOrCreate(['name' => 'Super-Admin']);
        $role3 = Role::firstOrCreate(['name' => 'Seller']);
        $role3->givePermissionTo('transfer money');
        $role4 = Role::firstOrCreate(['name' => 'Normal']);
        $role5 = Role::firstOrCreate(['name' => 'ApiClient']);
        // gets all permissions via Gate::before rule; see AuthServiceProvider

        // create demo users
        $user = \App\Models\User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        );
        $user->assignRole($role1);

        $user = \App\Models\User::firstOrCreate(
            ['email' => 'superadmin@admin.com'],
            ['name' => 'Super', 'password' => Hash::make('password')]
        );
        $user->assignRole($role2);
    }
}

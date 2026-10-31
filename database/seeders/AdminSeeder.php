<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the /admin account from ADMIN_USERNAME / ADMIN_PASSWORD in .env, or updates its password if it exists.
 * To change the password later: edit .env, then run `php artisan db:seed --class=AdminSeeder`.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $username = trim((string) config('wedding.admin_username'));
        $password = (string) config('wedding.admin_password');
        if ($username === '' || $password === '') {
            $this->command?->warn('ADMIN_USERNAME / ADMIN_PASSWORD are empty in .env, so no admin account was created.');

            return;
        }

        $now = now();
        $exists = DB::table('admins')->where('username', $username)->exists();
        DB::table('admins')->updateOrInsert(
            ['username' => $username],
            ['password' => Hash::make($password), 'updated_at' => $now] + ($exists ? [] : ['created_at' => $now]),
        );
        $this->command?->info("Admin account \"{$username}\" is ready.");
    }
}

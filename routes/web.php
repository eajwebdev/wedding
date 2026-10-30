<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\RsvpController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Support\Facades\Route;

// Laravel serves one Blade shell; Vite mounts the React invitation or admin application into it.
Route::view('/', 'app', ['page' => 'home'])->name('home');
Route::view('/admin', 'app', ['page' => 'admin'])->name('admin');

Route::prefix('api')->group(function () {
    Route::get('invite', [RsvpController::class, 'invite']);
    Route::post('rsvp', [RsvpController::class, 'store']);

    Route::prefix('admin')->controller(AdminController::class)->group(function () {
        Route::get('session', 'session');
        Route::post('login', 'login');
        Route::middleware(EnsureAdmin::class)->group(function () {
            Route::post('logout', 'logout');
            Route::get('data', 'data');
            Route::post('invites', 'storeInvite');
            Route::delete('invites/{id}', 'destroyInvite')->whereNumber('id');
            Route::delete('rsvps/{id}', 'destroyRsvp')->whereNumber('id');
            Route::get('export', 'export');
        });
    });
});

Route::fallback(fn () => abort(404));

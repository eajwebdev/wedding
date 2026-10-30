<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Guest-list routes need a signed-in session (set by AdminController::login). */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('admin')) {
            return response()->json(['error' => 'Sign in first.'], 401);
        }

        return $next($request);
    }
}

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The RSVP form is posted from the static invitation page, which has no Laravel CSRF token;
        // it is public by design and guarded by validation and a spam trap. /admin requests all carry X-XSRF-TOKEN.
        $middleware->validateCsrfTokens(except: ['api/rsvp']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // The pages read every /api answer as JSON, errors included (e.g. 419 when an admin session expired).
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));
    })->create();

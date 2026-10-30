<?php

namespace App\Http\Controllers;

use App\Support\GuestList;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

/** The couple's side (/admin): sign in, see replies, manage personal invite links, download the guest list. */
class AdminController extends Controller
{
    // Slow down password guessing: 5 failed attempts per address, then a 15-minute lockout.
    private const MAX_FAILS = 5;

    private const LOCK_SECONDS = 15 * 60;

    /** GET /api/admin/session. Also hands the page its XSRF-TOKEN cookie for the requests that change things. */
    public function session(Request $request): JsonResponse
    {
        return response()->json(['admin' => (bool) $request->session()->get('admin')]);
    }

    public function login(Request $request): JsonResponse
    {
        $key = 'admin-login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_FAILS)) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            return response()->json(['error' => "Too many attempts. Try again in {$minutes} minutes."], 429);
        }

        if (! $this->checkCredentials(trim((string) $request->input('username')), (string) $request->input('password'))) {
            RateLimiter::hit($key, self::LOCK_SECONDS);

            return response()->json(['error' => 'Incorrect username or password.'], 422);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put('admin', true);

        return response()->json(['ok' => true]);
    }

    private function checkCredentials(string $username, string $password): bool
    {
        $u = (string) config('wedding.admin_username');
        $p = (string) config('wedding.admin_password');
        if ($u === '' || $p === '') {
            return false; // no admin configured → nobody can log in
        }
        // Compare fixed-length hashes and evaluate both, so a wrong username takes as long as a wrong password.
        $okUser = hash_equals(hash('sha256', $u), hash('sha256', $username));
        $okPass = hash_equals(hash('sha256', $p), hash('sha256', $password));

        return $okUser && $okPass;
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    /** Everything /admin shows: replies (newest first) and invites with their reply status. */
    public function data(): JsonResponse
    {
        return response()->json([
            'rsvps' => GuestList::rsvps(),
            'invites' => GuestList::invites(),
            'maxInviteSeats' => config('wedding.max_invite_seats'),
        ]);
    }

    public function storeInvite(Request $request): JsonResponse
    {
        $name = preg_replace('/\s+/', ' ', trim((string) $request->input('name')));
        $seats = $request->input('seats');
        $max = config('wedding.max_invite_seats');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            return response()->json(['error' => "Enter the guest's name (2 to 100 characters)."], 422);
        }
        if (filter_var($seats, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => $max]]) === false) {
            return response()->json(['error' => "Seats must be 1 to {$max}."], 422);
        }
        GuestList::createInvite($name, (int) $seats);

        return response()->json(['ok' => true], 201);
    }

    /** The invite's link stops working; a reply it already sent is kept (invite_id becomes NULL). */
    public function destroyInvite(int $id): JsonResponse
    {
        DB::table('invites')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    public function destroyRsvp(int $id): JsonResponse
    {
        DB::table('rsvps')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    /** The guest list as a CSV for the caterer and seating plan: every reply, plus invites still waiting for one. */
    public function export(): Response
    {
        $invites = GuestList::invites();
        $seats = array_column($invites, 'seats', 'id');
        $when = fn (string $iso) => CarbonImmutable::parse($iso)->setTimezone('Asia/Manila')->format('M j, Y, g:i A');
        $rows = [['Name', 'Reply', 'Guests', 'Seats reserved', 'Mobile', 'Message', 'Received']];
        foreach (GuestList::rsvps() as $r) {
            $rows[] = [$r['guestName'], $r['attendance'] === 'yes' ? 'Attending' : 'Declined', $r['guestCount'],
                $r['inviteId'] !== null ? ($seats[$r['inviteId']] ?? '') : '', $r['phone'], $r['message'], $when($r['createdAt'])];
        }
        foreach ($invites as $i) {
            if (! $i['reply']) {
                $rows[] = [$i['name'], 'No reply yet', '', $i['seats'], '', '', ''];
            }
        }

        // Quote every cell, and defuse guest-typed text that a spreadsheet would run as a formula (=, +, -, @).
        $cell = function ($v) {
            $s = (string) $v;
            if (preg_match('/^[=+\-@\t\r]/', $s)) {
                $s = "'".$s;
            }

            return '"'.str_replace('"', '""', $s).'"';
        };
        $csv = "\u{FEFF}".implode("\r\n", array_map(fn ($row) => implode(',', array_map($cell, $row)), $rows)); // BOM: Excel then reads "Ñoño" correctly

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="edwin-jochel-guest-list.csv"',
            'Cache-Control' => 'no-store',
        ]);
    }
}

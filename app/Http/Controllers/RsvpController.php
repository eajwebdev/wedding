<?php

namespace App\Http\Controllers;

use App\Support\GuestList;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The guest side: a personal invite link looks itself up, and the RSVP form posts its answer. */
class RsvpController extends Controller
{
    /** GET /api/invite?code=CODE: the guest's name, their seats, and any reply they already sent. */
    public function invite(Request $request): JsonResponse
    {
        $code = $request->query('code');
        $invite = GuestList::isInviteCode($code) ? GuestList::findInvite($code) : null;
        if (! $invite) {
            return response()->json(['error' => 'Invalid invite'], 404);
        }

        return response()->json(['code' => $invite['code'], 'name' => $invite['name'], 'seats' => $invite['seats'], 'reply' => $invite['reply']]);
    }

    /**
     * POST /api/rsvp. With an invite code the name and seat limit come from the invite, and a new answer replaces the old one.
     * Closes the day after the wedding.
     */
    public function store(Request $request): JsonResponse
    {
        if (CarbonImmutable::now()->greaterThan(CarbonImmutable::parse(config('wedding.date'))->addDay())) {
            return response()->json(['error' => 'RSVPs are closed'], 403);
        }
        $body = $request->json()->all();
        if (is_string($body['website'] ?? null) && trim($body['website']) !== '') {
            return response()->json(['ok' => true]); // spam trap
        }

        $invite = null;
        if (array_key_exists('invite', $body) && $body['invite'] !== null) {
            $invite = GuestList::isInviteCode($body['invite']) ? GuestList::findInvite($body['invite']) : null;
            if (! $invite) {
                return response()->json(['error' => 'Invalid invite'], 400);
            }
        }

        $text = fn (string $key) => is_string($body[$key] ?? null) ? trim($body[$key]) : '';
        $name = $invite ? $invite['name'] : $text('guestName');
        $maxGuests = $invite ? $invite['seats'] : config('wedding.open_rsvp_max_guests');
        $attendance = $body['attendance'] ?? null;
        $guests = $body['guests'] ?? null;
        $phone = $text('phone');
        $message = $text('message');

        $valid = mb_strlen($name) >= 2 && mb_strlen($name) <= 100
            && in_array($attendance, ['yes', 'no'], true)
            && is_int($guests) && $guests >= 0 && $guests <= $maxGuests
            && ($attendance !== 'yes' || $guests >= 1) && ($attendance !== 'no' || $guests === 0)
            && ($phone === '' || preg_match('/^[0-9+()\-\s]{7,30}$/', $phone) === 1)
            && mb_strlen($message) <= 500;
        if (! $valid) {
            return response()->json(['error' => 'Invalid form values'], 400);
        }

        GuestList::saveRsvp($invite['id'] ?? null, $name, $attendance, $guests, $phone, $message);

        return response()->json(['ok' => true]);
    }
}

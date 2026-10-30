<?php

// Settings the RSVP API needs. Keep `date` and `open_rsvp_max_guests` in step with lib/wedding.ts (dateISO, openRsvpMaxGuests).
return [

    // Ceremony start (Philippine time). Replies close one day after it.
    'date' => env('WEDDING_DATE', '2026-12-26T15:00:00+08:00'),

    // Seats a guest can pick without a personal invite link.
    'open_rsvp_max_guests' => 5,

    // Most seats one personal invite link can hold.
    'max_invite_seats' => 10,

    // Login for /admin. Empty = nobody can sign in.
    'admin_username' => env('ADMIN_USERNAME'),
    'admin_password' => env('ADMIN_PASSWORD'),

];

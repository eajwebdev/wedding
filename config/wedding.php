<?php

// Settings the RSVP API needs. Keep `date` and `open_rsvp_max_guests` in step with lib/wedding.ts (dateISO, openRsvpMaxGuests).
return [

    // Ceremony start (Philippine time). Replies close one day after it.
    'date' => env('WEDDING_DATE', '2026-12-26T15:00:00+08:00'),

    // Calendar invitation details: from guest arrival (2:00 PM, an hour before the ceremony) to the 6:00 PM closing.
    'calendar_lead_minutes' => 60,
    'calendar_duration_minutes' => 240,
    'calendar_title' => "Edwin & Jochel's Wedding",
    'calendar_description' => "Celebrate Edwin and Jochel's wedding with us.",
    'venue' => 'AC Villa Private Resort, North Poblacion, Mabinay, Negros Oriental',

    // Seats a guest can pick without a personal invite link.
    'open_rsvp_max_guests' => 5,

    // Most seats one personal invite link can hold.
    'max_invite_seats' => 10,

    // The /admin account that `php artisan db:seed` saves (password hashed) into the admins table; login checks that table.
    'admin_username' => env('ADMIN_USERNAME'),
    'admin_password' => env('ADMIN_PASSWORD'),

];

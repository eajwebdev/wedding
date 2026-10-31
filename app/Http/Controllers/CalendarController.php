<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CalendarController extends Controller
{
    /** A real .ics response opens the native add-event screen on Apple devices. */
    public function __invoke(Request $request): Response
    {
        $start = CarbonImmutable::parse(config('wedding.date'))->utc()->subMinutes((int) config('wedding.calendar_lead_minutes'));
        $end = $start->addMinutes((int) config('wedding.calendar_duration_minutes'));
        $stamp = fn (CarbonImmutable $date): string => $date->format('Ymd\\THis\\Z');
        $escape = fn (string $value): string => str_replace(
            ["\\", ";", ",", "\r\n", "\r", "\n"],
            ["\\\\", "\\;", "\\,", "\\n", "\\n", "\\n"],
            $value,
        );

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Edwin & Jochel//Wedding Invitation//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:edwin-jochel-wedding@wedding.eajwebdev.com',
            'DTSTAMP:20261030T000000Z',
            'DTSTART:'.$stamp($start),
            'DTEND:'.$stamp($end),
            'SUMMARY:'.$escape(config('wedding.calendar_title')),
            'DESCRIPTION:'.$escape(config('wedding.calendar_description').' '.route('home')),
            'LOCATION:'.$escape(config('wedding.venue')),
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        // iPhone Safari shows Calendar's "Add" screen for an inline file; as an attachment it can stop at a download prompt.
        $disposition = preg_match('/iPhone|iPad|iPod/i', (string) $request->userAgent()) ? 'inline' : 'attachment';

        return response(implode("\r\n", $lines)."\r\n", 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => $disposition.'; filename="edwin-jochel-wedding.ics"',
            'Cache-Control' => 'public, max-age=86400',
            'Vary' => 'User-Agent',
        ]);
    }
}

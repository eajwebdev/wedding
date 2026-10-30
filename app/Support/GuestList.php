<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/** Reads and writes the `invites` and `rsvps` tables. Times are stored in UTC and sent to the browser as ISO 8601. */
class GuestList
{
    // No 0/o, 1/l/i: codes get read aloud and typed from screenshots.
    private const CODE_CHARS = '23456789abcdefghjkmnpqrstuvwxyz';

    public static function isInviteCode(mixed $code): bool
    {
        return is_string($code) && preg_match('/^[2-9a-hjkmnp-z]{8}$/', $code) === 1;
    }

    public static function now(): string
    {
        return CarbonImmutable::now('UTC')->format('Y-m-d H:i:s.v');
    }

    private static function iso(string $utc): string
    {
        return CarbonImmutable::parse($utc, 'UTC')->format('Y-m-d\TH:i:s.v\Z');
    }

    private static function invitesQuery()
    {
        return DB::table('invites as i')->leftJoin('rsvps as r', 'r.invite_id', '=', 'i.id')
            ->select('i.id', 'i.code', 'i.name', 'i.seats', 'i.created_at', 'r.attendance', 'r.guest_count', 'r.phone', 'r.message');
    }

    private static function toInvite(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'code' => $row->code,
            'name' => $row->name,
            'seats' => (int) $row->seats,
            'createdAt' => self::iso($row->created_at),
            'reply' => $row->attendance ? [
                'attendance' => $row->attendance,
                'guestCount' => (int) $row->guest_count,
                'phone' => $row->phone,
                'message' => $row->message,
            ] : null,
        ];
    }

    public static function findInvite(string $code): ?array
    {
        $row = self::invitesQuery()->where('i.code', $code)->first();

        return $row ? self::toInvite($row) : null;
    }

    public static function invites(): array
    {
        return self::invitesQuery()->orderBy('i.name')->get()->map(fn ($r) => self::toInvite($r))->all();
    }

    public static function rsvps(): array
    {
        return DB::table('rsvps')->orderByDesc('created_at')->orderByDesc('id')->get()->map(fn ($r) => [
            'id' => (int) $r->id,
            'inviteId' => $r->invite_id === null ? null : (int) $r->invite_id,
            'guestName' => $r->guest_name,
            'attendance' => $r->attendance,
            'guestCount' => (int) $r->guest_count,
            'phone' => $r->phone,
            'message' => $r->message,
            'createdAt' => self::iso($r->created_at),
        ])->all();
    }

    /** Saves a reply. With an invite it replaces that invite's earlier reply instead of adding a second one. */
    public static function saveRsvp(?int $inviteId, string $name, string $attendance, int $guests, string $phone, string $message): void
    {
        $row = ['invite_id' => $inviteId, 'guest_name' => $name, 'attendance' => $attendance, 'guest_count' => $guests,
            'phone' => $phone, 'message' => $message, 'created_at' => self::now()];
        if ($inviteId === null) {
            DB::table('rsvps')->insert($row);
        } else {
            DB::table('rsvps')->upsert($row, ['invite_id'], ['guest_name', 'attendance', 'guest_count', 'phone', 'message', 'created_at']);
        }
    }

    public static function createInvite(string $name, int $seats): void
    {
        for ($attempt = 0; ; $attempt++) {
            try {
                DB::table('invites')->insert(['code' => self::newCode(), 'name' => $name, 'seats' => $seats, 'created_at' => self::now()]);

                return;
            } catch (QueryException $e) {
                // A code collision: draw again (anything else is a real error).
                if ($attempt >= 4 || ! str_contains(strtolower($e->getMessage()), 'unique') && ($e->errorInfo[1] ?? null) !== 1062) {
                    throw $e;
                }
            }
        }
    }

    private static function newCode(): string
    {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= self::CODE_CHARS[random_int(0, strlen(self::CODE_CHARS) - 1)];
        }

        return $code;
    }
}

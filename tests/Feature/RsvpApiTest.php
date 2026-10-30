<?php

namespace Tests\Feature;

use App\Support\GuestList;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RsvpApiTest extends TestCase
{
    use RefreshDatabase;

    private function invite(string $code = 'zzsnts23', string $name = 'Santos Family', int $seats = 3): int
    {
        return DB::table('invites')->insertGetId(['code' => $code, 'name' => $name, 'seats' => $seats, 'created_at' => GuestList::now()]);
    }

    public function test_open_reply_is_saved(): void
    {
        $this->postJson('/api/rsvp', ['guestName' => 'Juan Reyes', 'attendance' => 'yes', 'guests' => 2, 'phone' => '0917 123 4567', 'message' => 'Congrats! 💛'])
            ->assertOk()->assertJson(['ok' => true]);
        $this->assertDatabaseHas('rsvps', ['guest_name' => 'Juan Reyes', 'attendance' => 'yes', 'guest_count' => 2, 'invite_id' => null, 'message' => 'Congrats! 💛']);
    }

    public function test_open_reply_is_validated(): void
    {
        $this->postJson('/api/rsvp', ['guestName' => 'Juan', 'attendance' => 'yes', 'guests' => 6])->assertStatus(400); // over open limit (5)
        $this->postJson('/api/rsvp', ['guestName' => 'J', 'attendance' => 'yes', 'guests' => 1])->assertStatus(400);
        $this->postJson('/api/rsvp', ['guestName' => 'Juan', 'attendance' => 'yes', 'guests' => 1, 'phone' => 'call me'])->assertStatus(400);
        $this->postJson('/api/rsvp', ['guestName' => 'Juan', 'attendance' => 'no', 'guests' => 1])->assertStatus(400);
        $this->postJson('/api/rsvp', ['guestName' => 'Juan', 'attendance' => 'maybe', 'guests' => 1])->assertStatus(400);
        $this->assertDatabaseCount('rsvps', 0);
    }

    public function test_spam_trap_answers_ok_without_saving(): void
    {
        $this->postJson('/api/rsvp', ['guestName' => 'Bot', 'attendance' => 'yes', 'guests' => 1, 'website' => 'http://spam'])->assertOk();
        $this->assertDatabaseCount('rsvps', 0);
    }

    public function test_invite_lookup(): void
    {
        $this->invite();
        $this->getJson('/api/invite?code=zzsnts23')->assertOk()
            ->assertExactJson(['code' => 'zzsnts23', 'name' => 'Santos Family', 'seats' => 3, 'reply' => null]);
        $this->getJson('/api/invite?code=zzzzzzzz')->assertNotFound();
        $this->getJson('/api/invite?code=nope')->assertNotFound();
        $this->getJson('/api/invite?code=zzsntos2')->assertNotFound(); // "o" is never in a code
    }

    public function test_invite_reply_uses_invite_name_caps_seats_and_replaces_earlier_answer(): void
    {
        $id = $this->invite();
        $this->postJson('/api/rsvp', ['invite' => 'zzsnts23', 'attendance' => 'yes', 'guests' => 4])->assertStatus(400);
        $this->postJson('/api/rsvp', ['invite' => 'zzzzzzzz', 'attendance' => 'yes', 'guests' => 1])->assertStatus(400);

        $this->postJson('/api/rsvp', ['invite' => 'zzsnts23', 'guestName' => 'Someone Else', 'attendance' => 'yes', 'guests' => 3])->assertOk();
        $this->postJson('/api/rsvp', ['invite' => 'zzsnts23', 'attendance' => 'no', 'guests' => 0, 'phone' => '+63 917 000 0000'])->assertOk();

        $this->assertDatabaseCount('rsvps', 1);
        $this->assertDatabaseHas('rsvps', ['invite_id' => $id, 'guest_name' => 'Santos Family', 'attendance' => 'no', 'guest_count' => 0]);
        $this->getJson('/api/invite?code=zzsnts23')->assertJsonPath('reply.attendance', 'no')->assertJsonPath('reply.phone', '+63 917 000 0000');
    }

    public function test_replies_close_the_day_after_the_wedding(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse(config('wedding.date'))->addDay()->addMinute());
        $this->postJson('/api/rsvp', ['guestName' => 'Late Guest', 'attendance' => 'yes', 'guests' => 1])->assertForbidden();
        CarbonImmutable::setTestNow(CarbonImmutable::parse(config('wedding.date'))->addHours(2));
        $this->postJson('/api/rsvp', ['guestName' => 'Wedding Day', 'attendance' => 'yes', 'guests' => 1])->assertOk();
        CarbonImmutable::setTestNow();
    }

    public function test_unknown_page_gets_404(): void
    {
        $this->get('/no-such-page')->assertNotFound();
    }
}

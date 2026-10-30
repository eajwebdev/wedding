<?php

namespace Tests\Feature;

use App\Support\GuestList;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['wedding.admin_username' => 'admin', 'wedding.admin_password' => 'correct horse']);
    }

    private function signedIn(): static
    {
        return $this->withSession(['admin' => true]);
    }

    public function test_guest_list_needs_sign_in(): void
    {
        $this->getJson('/api/admin/session')->assertOk()->assertExactJson(['admin' => false]);
        $this->getJson('/api/admin/data')->assertUnauthorized();
        $this->get('/api/admin/export')->assertUnauthorized();
        $this->postJson('/api/admin/invites', ['name' => 'X Family', 'seats' => 2])->assertUnauthorized();
        $this->deleteJson('/api/admin/rsvps/1')->assertUnauthorized();
    }

    public function test_sign_in_and_out(): void
    {
        $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'wrong'])->assertStatus(422)
            ->assertJson(['error' => 'Incorrect username or password.']);
        $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'correct horse'])->assertOk();
        $this->getJson('/api/admin/session')->assertExactJson(['admin' => true]);
        $this->getJson('/api/admin/data')->assertOk();
        $this->postJson('/api/admin/logout')->assertOk();
        $this->getJson('/api/admin/data')->assertUnauthorized();
    }

    public function test_five_wrong_passwords_lock_the_address(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'nope'])->assertStatus(422);
        }
        $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'correct horse'])->assertStatus(429)
            ->assertJsonPath('error', 'Too many attempts. Try again in 15 minutes.');
    }

    public function test_nobody_can_sign_in_without_configured_credentials(): void
    {
        config(['wedding.admin_username' => '', 'wedding.admin_password' => '']);
        $this->postJson('/api/admin/login', ['username' => '', 'password' => ''])->assertStatus(422);
    }

    public function test_create_invite_and_read_guest_list(): void
    {
        $this->signedIn()->postJson('/api/admin/invites', ['name' => 'X', 'seats' => 2])->assertStatus(422);
        $this->signedIn()->postJson('/api/admin/invites', ['name' => 'Dela Cruz Family', 'seats' => 11])->assertStatus(422)
            ->assertJson(['error' => 'Seats must be 1 to 10.']);
        $this->signedIn()->postJson('/api/admin/invites', ['name' => '  Dela   Cruz Family ', 'seats' => '4'])->assertCreated();

        $code = DB::table('invites')->value('code');
        $this->assertTrue(GuestList::isInviteCode($code), "generated code {$code} is valid");
        $this->postJson('/api/rsvp', ['invite' => $code, 'attendance' => 'yes', 'guests' => 4])->assertOk();
        $this->postJson('/api/rsvp', ['guestName' => 'Juan Reyes', 'attendance' => 'no', 'guests' => 0])->assertOk();

        $data = $this->signedIn()->getJson('/api/admin/data')->assertOk()
            ->assertJsonPath('invites.0.name', 'Dela Cruz Family')
            ->assertJsonPath('invites.0.seats', 4)
            ->assertJsonPath('invites.0.reply.guestCount', 4)
            ->assertJsonPath('maxInviteSeats', 10)
            ->assertJsonCount(2, 'rsvps')
            ->json('rsvps');
        $byName = array_column($data, null, 'guestName');
        $this->assertNull($byName['Juan Reyes']['inviteId']);
        $this->assertSame(DB::table('invites')->value('id'), $byName['Dela Cruz Family']['inviteId']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/', $byName['Juan Reyes']['createdAt']);
    }

    public function test_deleting_an_invite_keeps_its_reply_and_deleting_a_reply_removes_it(): void
    {
        $id = DB::table('invites')->insertGetId(['code' => 'zzsnts23', 'name' => 'Santos Family', 'seats' => 2, 'created_at' => GuestList::now()]);
        $this->postJson('/api/rsvp', ['invite' => 'zzsnts23', 'attendance' => 'yes', 'guests' => 2])->assertOk();

        $this->signedIn()->deleteJson("/api/admin/invites/{$id}")->assertOk();
        $this->assertDatabaseCount('invites', 0);
        $this->assertDatabaseHas('rsvps', ['guest_name' => 'Santos Family', 'invite_id' => null]);

        $rsvp = DB::table('rsvps')->value('id');
        $this->signedIn()->deleteJson("/api/admin/rsvps/{$rsvp}")->assertOk();
        $this->assertDatabaseCount('rsvps', 0);
    }

    public function test_csv_export(): void
    {
        DB::table('invites')->insert(['code' => 'zzdlcrz3', 'name' => 'Dela Cruz Family', 'seats' => 4, 'created_at' => GuestList::now()]);
        $this->postJson('/api/rsvp', ['guestName' => 'Ñoño Reyes', 'attendance' => 'yes', 'guests' => 2, 'message' => '=1+1'])->assertOk();

        $res = $this->signedIn()->get('/api/admin/export')->assertOk()
            ->assertHeader('Content-Disposition', 'attachment; filename="edwin-jochel-guest-list.csv"');
        $csv = $res->getContent();
        $this->assertStringStartsWith("\u{FEFF}\"Name\",\"Reply\"", $csv);
        $this->assertStringContainsString('"Ñoño Reyes","Attending","2","","","\'=1+1"', $csv);
        $this->assertStringContainsString('"Dela Cruz Family","No reply yet","","4","","",""', $csv);
    }
}

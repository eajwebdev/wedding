import { NextResponse } from "next/server";
import { getInvite, isInviteCode, saveRsvp } from "@/lib/db";
import { wedding, weddingEndsAt } from "@/lib/wedding";

// Responses are saved to the MySQL table `rsvps` and listed at /admin.
// With an invite code the name and seat limit come from the invite, and a new answer replaces the old one.
export async function POST(request: Request) {
  if (Date.now() > weddingEndsAt) return NextResponse.json({ error: "RSVPs are closed" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true }); // spam trap

  let invite = null;
  if (body.invite != null) {
    if (!isInviteCode(body.invite)) return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    try { invite = await getInvite(body.invite); } catch (err) {
      console.error("Wedding RSVP: could not load invite", err);
      return NextResponse.json({ error: "Unable to save RSVP" }, { status: 500 });
    }
    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const guestName = invite ? invite.name : typeof body.guestName === "string" ? body.guestName.trim() : "";
  const maxGuests = invite ? invite.seats : wedding.openRsvpMaxGuests;
  const attendance = body.attendance;
  const guests = Number(body.guests);
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (guestName.length < 2 || guestName.length > 100 || (attendance !== "yes" && attendance !== "no") || !Number.isInteger(guests) || guests < 0 || guests > maxGuests || (attendance === "yes" && guests < 1) || (attendance === "no" && guests !== 0) || phone.length > 30 || (phone && !/^[0-9+()\-\s]{7,30}$/.test(phone)) || message.length > 500) {
    return NextResponse.json({ error: "Invalid form values" }, { status: 400 });
  }
  try {
    await saveRsvp({ inviteId: invite?.id ?? null, guestName, attendance, guestCount: guests, phone, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Wedding RSVP: could not save to MySQL", err);
    return NextResponse.json({ error: "Unable to save RSVP" }, { status: 500 });
  }
}

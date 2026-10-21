import { NextResponse } from "next/server";
import { addRsvp } from "@/lib/db";

// Responses are saved to the SQLite file data/rsvps.db and listed at /admin.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true }); // spam trap
  const guestName = typeof body.guestName === "string" ? body.guestName.trim() : "";
  const attendance = body.attendance;
  const guests = Number(body.guests);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (guestName.length < 2 || guestName.length > 100 || (attendance !== "yes" && attendance !== "no") || !Number.isInteger(guests) || guests < 0 || guests > 5 || (attendance === "yes" && guests < 1) || (attendance === "no" && guests !== 0) || message.length > 500) {
    return NextResponse.json({ error: "Invalid form values" }, { status: 400 });
  }
  try {
    addRsvp({ guestName, attendance, guestCount: guests, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Wedding RSVP: could not save to SQLite", err);
    return NextResponse.json({ error: "Unable to save RSVP" }, { status: 500 });
  }
}

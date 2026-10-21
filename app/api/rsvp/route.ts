import { NextResponse } from "next/server";

// Responses are stored only when the server's Supabase credentials are configured.
// Never ship the service role key to the browser.
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
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "RSVP database has not been configured" }, { status: 503 });
  try {
    const res = await fetch(`${url}/rest/v1/wedding_rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
      body: JSON.stringify({ guest_name: guestName, attendance, guest_count: guests, message }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Wedding RSVP: Supabase returned", res.status);
      return NextResponse.json({ error: "Unable to save RSVP" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Wedding RSVP service connection failed", err);
    return NextResponse.json({ error: "Unable to connect to RSVP service" }, { status: 502 });
  }
}

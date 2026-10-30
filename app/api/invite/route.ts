import { NextResponse } from "next/server";
import { getInvite, isInviteCode } from "@/lib/db";

// A personal invite link (/?invite=CODE) looks itself up here: the guest's name, their seats, and any reply they already sent.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!isInviteCode(code)) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  try {
    const invite = await getInvite(code);
    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    return NextResponse.json({ code: invite.code, name: invite.name, seats: invite.seats, reply: invite.reply });
  } catch (err) {
    console.error("Wedding RSVP: could not load invite", err);
    return NextResponse.json({ error: "Unable to load invite" }, { status: 500 });
  }
}

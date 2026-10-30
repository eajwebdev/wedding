import { isAdmin } from "@/lib/auth";
import { listInvites, listRsvps } from "@/lib/db";

export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

// Quote every cell, and defuse guest-typed text that a spreadsheet would run as a formula (=, +, -, @).
const cell = (v: string | number) => {
  const s = String(v);
  return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** The guest list as a CSV for the caterer and seating plan: every reply, plus invites still waiting for one. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Sign in at /admin first.", { status: 401 });
  const [rsvps, invites] = await Promise.all([listRsvps(), listInvites()]);
  const seats = new Map(invites.map((i) => [i.id, i.seats]));
  const rows: (string | number)[][] = [
    ["Name", "Reply", "Guests", "Seats reserved", "Mobile", "Message", "Received"],
    ...rsvps.map((r) => [r.guestName, r.attendance === "yes" ? "Attending" : "Declined", r.guestCount,
      r.inviteId != null ? seats.get(r.inviteId) ?? "" : "", r.phone, r.message, when.format(new Date(r.createdAt))]),
    ...invites.filter((i) => !i.reply).map((i) => [i.name, "No reply yet", "", i.seats, "", "", ""]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n"); // BOM: Excel then reads names like "Ñoño" correctly
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="edwin-jochel-guest-list.csv"',
      "Cache-Control": "no-store",
    },
  });
}

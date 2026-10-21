import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { listRsvps } from "@/lib/db";
import { wedding } from "@/lib/wedding";
import { logout } from "./actions";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Guest list | E & J", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="admin admin-center">
        <div className="rsvp-card admin-card">
          <img className="invite-seal" src="/images/ej-logo-512.png" alt="" aria-hidden="true" />
          <p className="eyebrow dark">{wedding.names.first} & {wedding.names.second}</p>
          <h1 className="admin-title">Guest list</h1>
          <LoginForm />
        </div>
      </main>
    );
  }

  const rsvps = listRsvps();
  const coming = rsvps.filter((r) => r.attendance === "yes");
  const stats: [string, number][] = [
    ["Responses", rsvps.length],
    ["Attending", coming.length],
    ["Total guests", coming.reduce((sum, r) => sum + r.guestCount, 0)],
    ["Declined", rsvps.length - coming.length],
  ];

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="eyebrow">{wedding.names.first} & {wedding.names.second} · RSVPs</p>
          <h1 className="admin-title light">Guest list</h1>
        </div>
        <form action={logout}>
          <button type="submit" className="round-button" aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
        </form>
      </header>

      <dl className="admin-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="glass"><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

      {rsvps.length === 0 ? (
        <p className="admin-empty glass">No responses yet. They’ll appear here as guests reply.</p>
      ) : (
        <div className="admin-table-wrap glass">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Reply</th><th>Guests</th><th>Message</th><th>Received</th></tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td data-label="Name">{r.guestName}</td>
                  <td data-label="Reply"><span className={`admin-pill ${r.attendance}`}>{r.attendance === "yes" ? "Attending" : "Declined"}</span></td>
                  <td data-label="Guests">{r.guestCount}</td>
                  <td data-label="Message" className="admin-message">{r.message || "—"}</td>
                  <td data-label="Received">{when.format(new Date(r.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

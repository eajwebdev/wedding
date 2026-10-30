"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, LogOut } from "lucide-react";
import { wedding } from "@/lib/wedding";
import { adminApi, signedOut, type GuestData } from "./api";
import { ConfirmDelete, CopyLink, InviteForm } from "./AdminControls";
import LoginForm from "./LoginForm";

const when = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

/** The guest list. The page is a static file; everything here comes from Laravel's /api/admin routes. */
export default function AdminApp() {
  const [phase, setPhase] = useState<"loading" | "signed-out" | "signed-in" | "offline">("loading");
  const [data, setData] = useState<GuestData | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi<GuestData>("data");
      if (signedOut(res.status)) { setPhase("signed-out"); return; }
      if (!res.ok) { setPhase("offline"); return; }
      setData(res.data as GuestData);
      setPhase("signed-in");
    } catch { setPhase("offline"); }
  }, []);

  // Ask Laravel whether we're signed in; this also gives the page its XSRF-TOKEN cookie.
  useEffect(() => {
    adminApi<{ admin: boolean }>("session")
      .then((res) => (res.ok ? (res.data.admin ? load() : setPhase("signed-out")) : setPhase("offline")))
      .catch(() => setPhase("offline"));
  }, [load]);

  /** Runs a change, then refreshes the list (or shows the login form if the session ended). */
  async function change(path: string, method: string, body?: unknown) {
    const res = await adminApi(path, method, body);
    if (signedOut(res.status)) { setPhase("signed-out"); return res; }
    await load();
    return res;
  }

  async function createInvite(name: string, seats: number) {
    try {
      const res = await change("invites", "POST", { name, seats });
      return res.ok || signedOut(res.status) ? "" : res.data.error ?? "Could not save the invite. Try again.";
    } catch { return "Can't reach the server. Try again."; }
  }

  async function logout() {
    await adminApi("logout", "POST").catch(() => {});
    setData(null);
    setPhase("signed-out");
  }

  if (phase !== "signed-in" || !data) {
    return (
      <main className="admin admin-center">
        <div className="rsvp-card admin-card">
          <img className="invite-seal" src="/images/ej-logo-512.png" alt="" aria-hidden="true" />
          <p className="eyebrow dark">{wedding.names.first} & {wedding.names.second}</p>
          <h1 className="admin-title">Guest list</h1>
          {phase === "signed-out" && <LoginForm onSignedIn={load} />}
          {phase === "loading" && <p className="form-status" role="status">Loading…</p>}
          {phase === "offline" && <p className="form-status error" role="status">Can&apos;t reach the server. Check your connection and reload the page.</p>}
        </div>
      </main>
    );
  }

  const { rsvps, invites, maxInviteSeats } = data;
  const coming = rsvps.filter((r) => r.attendance === "yes");
  const stats: [string, number][] = [
    ["Guests attending", coming.reduce((sum, r) => sum + r.guestCount, 0)],
    ["Replies", rsvps.length],
    ["Declined", rsvps.length - coming.length],
    ["Awaiting reply", invites.filter((i) => !i.reply).length],
  ];

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="eyebrow">{wedding.names.first} & {wedding.names.second} · RSVPs</p>
          <h1 className="admin-title light">Guest list</h1>
        </div>
        <div className="admin-actions">
          <a className="admin-chip" href="/api/admin/export" download><Download size={14} /> CSV</a>
          <button type="button" className="round-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>

      <dl className="admin-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="glass"><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

      <section className="admin-section">
        <h2 className="admin-subtitle">Personal invites</h2>
        <p className="admin-help">Create one link per guest or family and send it to them. It greets them by name, limits their seats, and lets them change their reply later without making duplicates.</p>
        <div className="glass admin-panel"><InviteForm maxSeats={maxInviteSeats} create={createInvite} /></div>
        {invites.length > 0 && (
          <div className="admin-table-wrap glass">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Seats</th><th>Status</th><th>Link</th><th><span className="sr-only">Delete</span></th></tr></thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td data-label="Name">{i.name}</td>
                    <td data-label="Seats">{i.seats}</td>
                    <td data-label="Status">{i.reply
                      ? <span className={`admin-pill ${i.reply.attendance}`}>{i.reply.attendance === "yes" ? `Attending · ${i.reply.guestCount}` : "Declined"}</span>
                      : <span className="admin-pill wait">Waiting</span>}</td>
                    <td data-label="Link"><CopyLink code={i.code} name={i.name} /></td>
                    <td data-label="Delete">
                      <ConfirmDelete label={`Delete invite for ${i.name}`} onConfirm={() => change(`invites/${i.id}`, "DELETE")}
                        question={`Delete the invite for ${i.name}? Their link stops working. A reply they already sent is kept.`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-subtitle">Replies</h2>
        {rsvps.length === 0 ? (
          <p className="admin-empty glass">No responses yet. They’ll appear here as guests reply.</p>
        ) : (
          <div className="admin-table-wrap glass">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Reply</th><th>Guests</th><th>Mobile</th><th>Message</th><th>Received</th><th><span className="sr-only">Delete</span></th></tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Name">{r.guestName}{r.inviteId != null && <small className="admin-tag">invite</small>}</td>
                    <td data-label="Reply"><span className={`admin-pill ${r.attendance}`}>{r.attendance === "yes" ? "Attending" : "Declined"}</span></td>
                    <td data-label="Guests">{r.guestCount}</td>
                    <td data-label="Mobile">{r.phone ? <a href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`}>{r.phone}</a> : "None"}</td>
                    <td data-label="Message" className="admin-message">{r.message || "None"}</td>
                    <td data-label="Received">{when.format(new Date(r.createdAt))}</td>
                    <td data-label="Delete">
                      <ConfirmDelete label={`Delete reply from ${r.guestName}`} onConfirm={() => change(`rsvps/${r.id}`, "DELETE")}
                        question={`Delete the reply from ${r.guestName}? This cannot be undone.`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

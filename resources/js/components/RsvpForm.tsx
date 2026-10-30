"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Minus, Pencil, Plus, Send } from "lucide-react";
import { wedding, weddingEndsAt } from "@/lib/wedding";

type Reply = { attendance: "yes" | "no"; guestCount: number; phone: string; message: string };
/** A personal invite (/?invite=CODE): the name and seats come from /admin, and `reply` is the guest's last answer. */
export type InviteInfo = { code: string; name: string; seats: number; reply: Reply | null };
type RsvpResult = { state: "idle" | "loading" | "saved" | "error"; message: string };

const summary = (r: Reply) => r.attendance === "yes" ? `Joyfully accepts · ${r.guestCount} ${r.guestCount === 1 ? "guest" : "guests"}` : "Regretfully declines";

export default function RsvpForm({ invite }: { invite: InviteInfo | null }) {
  const maxGuests = invite?.seats ?? wedding.openRsvpMaxGuests;
  const [reply, setReply] = useState<Reply | null>(invite?.reply ?? null); // what this guest last sent
  const [attendance, setAttendance] = useState<"yes" | "no">(reply?.attendance ?? "yes");
  const [guests, setGuests] = useState(Math.min(maxGuests, Math.max(1, reply?.guestCount ?? 1)));
  const [result, setResult] = useState<RsvpResult>({ state: reply ? "saved" : "idle", message: "" });
  const [closed, setClosed] = useState(false);
  useEffect(() => setClosed(Date.now() > weddingEndsAt), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      invite: invite?.code,
      guestName: invite ? invite.name : String(data.get("guestName") ?? "").trim(),
      attendance,
      guests: attendance === "yes" ? guests : 0,
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };
    if (payload.guestName.length < 2) {
      setResult({ state: "error", message: "Please enter your name." });
      return;
    }
    if (payload.phone && !/^[0-9+()\-\s]{7,30}$/.test(payload.phone)) {
      setResult({ state: "error", message: "Please check your mobile number, or leave it blank." });
      return;
    }
    setResult({ state: "loading", message: "Sending your reply…" });
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (response.ok) {
        setReply({ attendance, guestCount: payload.guests, phone: payload.phone, message: payload.message });
        setResult({ state: "saved", message: attendance === "yes" ? "We can’t wait to celebrate with you!" : "Thank you for letting us know. You’ll be missed." });
        if (!invite) form.reset();
      } else if (response.status === 403) {
        setClosed(true);
      } else {
        setResult({ state: "error", message: "We couldn't save your response. Please try again." });
      }
    } catch {
      setResult({ state: "error", message: "Connection problem. Please try again." });
    }
  }

  if (closed) return (
    <div className="rsvp-success" role="status">
      <span className="success-ring"><Check size={30} strokeWidth={1.4} /></span>
      <p className="success-title">Thank you!</p>
      <p className="success-copy">Our RSVP is now closed. Thank you to everyone who celebrated with us.</p>
    </div>
  );

  if (result.state === "saved") return (
    <div className="rsvp-success" role="status">
      <span className="success-ring"><Check size={30} strokeWidth={1.4} /></span>
      <p className="success-title">Thank you{invite ? `, ${invite.name.split(" ")[0]}` : ""}!</p>
      {invite && reply && <p className="rsvp-reply">{summary(reply)}</p>}
      <p className="success-copy">{result.message ? `Your response has been received. ${result.message}` : "We have your response. You can change it any time before the wedding."}</p>
      {invite
        ? <button type="button" className="text-button" onClick={() => setResult({ state: "idle", message: "" })}><Pencil size={13} /> Change my response</button>
        : <button type="button" className="text-button" onClick={() => setResult({ state: "idle", message: "" })}>Send another response</button>}
    </div>
  );

  return (
    <form onSubmit={submit} className="rsvp-form" noValidate>
      {invite ? (
        <p className="rsvp-for">Replying for <strong>{invite.name}</strong>
          <small>{invite.seats === 1 ? "We have reserved 1 seat for you" : `We have reserved ${invite.seats} seats for you`}</small></p>
      ) : (
        <div className="field">
          <label className="form-label" htmlFor="guestName">Your full name</label>
          <input id="guestName" name="guestName" type="text" placeholder="Enter your name" autoComplete="name" maxLength={100} required minLength={2}
            aria-invalid={result.state === "error" && result.message.includes("name")} />
        </div>
      )}

      <fieldset className="field attending-options">
        <legend className="form-label">Will you celebrate with us?</legend>
        <div className="segmented">
          {([["yes", "Joyfully accepts"], ["no", "Regretfully declines"]] as const).map(([value, label]) => (
            <label key={value} className={attendance === value ? "segment selected" : "segment"}>
              <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
              <span className="segment-dot" aria-hidden="true" />{label}
            </label>
          ))}
        </div>
      </fieldset>

      {attendance === "yes" && maxGuests > 1 && (
        <div className="field">
          <span className="form-label" id="guestCountLabel">Number of guests <small>(including yourself)</small></span>
          <div className="stepper" role="group" aria-labelledby="guestCountLabel">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="Fewer guests"><Minus size={18} /></button>
            <output aria-live="polite">{guests} <small>{guests === 1 ? "guest" : "guests"}</small></output>
            <button type="button" onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} disabled={guests >= maxGuests} aria-label="More guests"><Plus size={18} /></button>
          </div>
        </div>
      )}

      <div className="field">
        <label className="form-label" htmlFor="phone">Mobile number <small>(optional, in case we need to reach you)</small></label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxxx" maxLength={30} defaultValue={reply?.phone}
          aria-invalid={result.state === "error" && result.message.includes("mobile")} />
      </div>

      <div className="field">
        <label className="form-label" htmlFor="message">A note for us <small>(optional)</small></label>
        <textarea id="message" name="message" placeholder="Leave a little message of love…" rows={3} maxLength={500} defaultValue={reply?.message} />
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input type="text" tabIndex={-1} autoComplete="off" name="website" id="website" /></div>
      <button className="gold-button form-submit" type="submit" disabled={result.state === "loading"}>
        <span>{result.state === "loading" ? "Sending…" : reply && invite ? "Update my response" : "Send my response"}</span> <Send size={16} strokeWidth={1.6} />
      </button>
      <p className={`form-status ${result.state}`} role="status">{result.message || "Your response matters to us. We can’t wait to celebrate together."}</p>
    </form>
  );
}

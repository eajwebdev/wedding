"use client";

import { FormEvent, useState } from "react";
import { Check, Minus, Plus, Send } from "lucide-react";

type RsvpResult = { state: "idle" | "loading" | "saved" | "error"; message: string };
const MAX_GUESTS = 5;

export default function RsvpForm() {
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [result, setResult] = useState<RsvpResult>({ state: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      guestName: String(data.get("guestName") ?? "").trim(),
      attendance,
      guests: attendance === "yes" ? guests : 0,
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };
    if (payload.guestName.length < 2) {
      setResult({ state: "error", message: "Please enter your name." });
      return;
    }
    setResult({ state: "loading", message: "Sending your reply…" });
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (response.ok) {
        setResult({ state: "saved", message: attendance === "yes" ? "We can’t wait to celebrate with you!" : "Thank you for letting us know. You’ll be missed." });
        form.reset();
      } else {
        setResult({ state: "error", message: "We couldn't save your response. Please try again." });
      }
    } catch {
      setResult({ state: "error", message: "Connection problem. Please try again." });
    }
  }

  if (result.state === "saved") return (
    <div className="rsvp-success" role="status">
      <span className="success-ring"><Check size={30} strokeWidth={1.4} /></span>
      <p className="success-title">Thank you!</p>
      <p className="success-copy">Your response has been received. {result.message}</p>
      <button type="button" className="text-button" onClick={() => setResult({ state: "idle", message: "" })}>Send another response</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="rsvp-form" noValidate>
      <div className="field">
        <label className="form-label" htmlFor="guestName">Your full name</label>
        <input id="guestName" name="guestName" type="text" placeholder="Enter your name" autoComplete="name" maxLength={100} required minLength={2}
          aria-invalid={result.state === "error" && result.message.includes("name")} />
      </div>

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

      {attendance === "yes" && (
        <div className="field">
          <span className="form-label" id="guestCountLabel">Number of guests <small>(including yourself)</small></span>
          <div className="stepper" role="group" aria-labelledby="guestCountLabel">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="Fewer guests"><Minus size={18} /></button>
            <output aria-live="polite">{guests} <small>{guests === 1 ? "guest" : "guests"}</small></output>
            <button type="button" onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} disabled={guests >= MAX_GUESTS} aria-label="More guests"><Plus size={18} /></button>
          </div>
        </div>
      )}

      <div className="field">
        <label className="form-label" htmlFor="message">A note for us <small>(optional)</small></label>
        <textarea id="message" name="message" placeholder="Leave a little message of love…" rows={3} maxLength={500} />
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input type="text" tabIndex={-1} autoComplete="off" name="website" id="website" /></div>
      <button className="gold-button form-submit" type="submit" disabled={result.state === "loading"}>
        <span>{result.state === "loading" ? "Sending…" : "Send my response"}</span> <Send size={16} strokeWidth={1.6} />
      </button>
      <p className={`form-status ${result.state}`} role="status">{result.message || "Your response matters to us. We can’t wait to celebrate together."}</p>
    </form>
  );
}

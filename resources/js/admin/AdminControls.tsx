"use client";

import { FormEvent, useState } from "react";
import { Check, Link2, Plus, Trash2 } from "lucide-react";

/** Name + seats → a personal invite link. `create` returns an error message, or "" when saved (the form then clears). */
export function InviteForm({ maxSeats, create }: { maxSeats: number; create: (name: string, seats: number) => Promise<string> }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setPending(true);
    const message = await create(String(form.get("name") ?? ""), Number(form.get("seats")));
    setPending(false);
    setError(message);
    if (!message) formEl.reset();
  }

  return (
    <form onSubmit={submit} className="invite-form rsvp-form">
      <div className="field">
        <label className="form-label" htmlFor="invite-name">Guest or family name</label>
        <input id="invite-name" name="name" type="text" placeholder="e.g. Santos Family" maxLength={100} required autoComplete="off" />
      </div>
      <div className="field invite-seats">
        <label className="form-label" htmlFor="invite-seats">Seats</label>
        <input id="invite-seats" name="seats" type="number" inputMode="numeric" min={1} max={maxSeats} defaultValue={2} required />
      </div>
      <button className="gold-button" type="submit" disabled={pending}><Plus size={16} /> <span>{pending ? "Saving…" : "Create link"}</span></button>
      <p className={`form-status ${error ? "error" : ""}`} role="status">{error}</p>
    </form>
  );
}

/** Copies the guest's personal link, built from whatever address the site is opened at. */
export function CopyLink({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const url = `${window.location.origin}/?invite=${code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => window.prompt(`Invite link for ${name}`, url)); // clipboard blocked (e.g. plain http): show it to copy by hand
  }
  return (
    <button type="button" className="admin-chip" onClick={copy} aria-label={`Copy invite link for ${name}`}>
      {copied ? <><Check size={14} /> Copied</> : <><Link2 size={14} /> Copy link</>}
    </button>
  );
}

/** A delete button that asks first. */
export function ConfirmDelete({ label, question, onConfirm }: { label: string; question: string; onConfirm: () => void }) {
  return (
    <button type="button" className="admin-chip danger" aria-label={label} title={label}
      onClick={() => { if (window.confirm(question)) onConfirm(); }}>
      <Trash2 size={14} />
    </button>
  );
}

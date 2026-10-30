"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Link2, Plus, Trash2 } from "lucide-react";
import { addInvite, type InviteState } from "./actions";

/** Name + seats → a personal invite link. Clears itself after each saved invite. */
export function InviteForm({ maxSeats }: { maxSeats: number }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(addInvite, { error: "", ok: 0 });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) form.current?.reset(); }, [state.ok]);
  return (
    <form ref={form} action={action} className="invite-form rsvp-form">
      <div className="field">
        <label className="form-label" htmlFor="invite-name">Guest or family name</label>
        <input id="invite-name" name="name" type="text" placeholder="e.g. Santos Family" maxLength={100} required autoComplete="off" />
      </div>
      <div className="field invite-seats">
        <label className="form-label" htmlFor="invite-seats">Seats</label>
        <input id="invite-seats" name="seats" type="number" inputMode="numeric" min={1} max={maxSeats} defaultValue={2} required />
      </div>
      <button className="gold-button" type="submit" disabled={pending}><Plus size={16} /> <span>{pending ? "Saving…" : "Create link"}</span></button>
      <p className={`form-status ${state.error ? "error" : ""}`} role="status">{state.error}</p>
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

/** A delete button inside a server-action form that asks first. */
export function ConfirmDelete({ label, question }: { label: string; question: string }) {
  return (
    <button type="submit" className="admin-chip danger" aria-label={label} title={label}
      onClick={(e) => { if (!window.confirm(question)) e.preventDefault(); }}>
      <Trash2 size={14} />
    </button>
  );
}

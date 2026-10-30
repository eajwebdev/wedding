"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { adminApi } from "./api";

export default function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const res = await adminApi("login", "POST", { username: String(form.get("username") ?? ""), password: String(form.get("password") ?? "") });
      if (res.ok) { setError(""); onSignedIn(); return; }
      setError(res.data.error ?? (res.status === 419 ? "The page expired. Reload it and try again." : "Could not sign in. Try again."));
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="admin-login rsvp-form">
      <div className="field">
        <label className="form-label" htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" required />
      </div>
      <div className="field">
        <label className="form-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          aria-invalid={!!error} aria-describedby="login-status" />
      </div>
      <button className="gold-button form-submit" type="submit" disabled={pending}>
        <LogIn size={16} strokeWidth={1.6} /> <span>{pending ? "Signing in…" : "Sign in"}</span>
      </button>
      <p id="login-status" className={`form-status ${error ? "error" : ""}`} role="status">{error}</p>
    </form>
  );
}

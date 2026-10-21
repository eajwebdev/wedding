"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: "", username: "" });
  return (
    <form action={action} className="admin-login rsvp-form">
      <div className="field">
        <label className="form-label" htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" required
          defaultValue={state.username} key={state.username} />
      </div>
      <div className="field">
        <label className="form-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          aria-invalid={!!state.error} aria-describedby="login-status" />
      </div>
      <button className="gold-button form-submit" type="submit" disabled={pending}>
        <LogIn size={16} strokeWidth={1.6} /> <span>{pending ? "Signing in…" : "Sign in"}</span>
      </button>
      <p id="login-status" className={`form-status ${state.error ? "error" : ""}`} role="status">{state.error}</p>
    </form>
  );
}

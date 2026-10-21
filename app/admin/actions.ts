"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, newSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

export type LoginState = { error: string; username: string }; // username refills the field after a failed try

// Slow down password guessing: 5 failed attempts per address, then a 15-minute lockout.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60000;
const fails = new Map<string, { count: number; until: number }>();

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  const now = Date.now();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const record = fails.get(ip);
  if (record && record.count >= MAX_FAILS && record.until > now) {
    return { error: `Too many attempts. Try again in ${Math.ceil((record.until - now) / 60000)} minutes.`, username };
  }

  if (!checkCredentials(username, password)) {
    const count = record && record.until > now ? record.count + 1 : 1;
    fails.set(ip, { count, until: now + LOCK_MS });
    return { error: "Incorrect username or password.", username };
  }

  fails.delete(ip);
  (await cookies()).set(SESSION_COOKIE, newSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: h.get("x-forwarded-proto") === "https", // plain http on localhost / your Wi-Fi would drop a secure cookie
    path: "/admin",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin");
}

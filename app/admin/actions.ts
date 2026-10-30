"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, isAdmin, newSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { createInvite, deleteInvite, deleteRsvp, MAX_INVITE_SEATS } from "@/lib/db";

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

// Every guest-list change re-checks the session: server actions are public endpoints.
async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export type InviteState = { error: string; ok: number }; // ok counts successes so the form can clear itself

export async function addInvite(prev: InviteState, form: FormData): Promise<InviteState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
  const seats = Number(form.get("seats"));
  if (name.length < 2 || name.length > 100) return { ...prev, error: "Enter the guest's name (2 to 100 characters)." };
  if (!Number.isInteger(seats) || seats < 1 || seats > MAX_INVITE_SEATS) return { ...prev, error: `Seats must be 1 to ${MAX_INVITE_SEATS}.` };
  try {
    await createInvite(name, seats);
  } catch (err) {
    console.error("Wedding RSVP: could not create invite", err);
    return { ...prev, error: "Could not save the invite. Check the database connection." };
  }
  revalidatePath("/admin");
  return { error: "", ok: prev.ok + 1 };
}

export async function removeInvite(form: FormData) {
  await requireAdmin();
  await deleteInvite(Number(form.get("id")));
  revalidatePath("/admin");
}

export async function removeRsvp(form: FormData) {
  await requireAdmin();
  await deleteRsvp(Number(form.get("id")));
  revalidatePath("/admin");
}

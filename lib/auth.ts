import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** Admin login for /admin. Credentials and the signing secret come from .env.local, never from code. */
export const SESSION_COOKIE = "ej_admin";
export const SESSION_DAYS = 7;

const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b)); // equal-length digests, constant time

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set in .env.local (32+ characters)");
  return s;
}

const sign = (expires: number) => createHmac("sha256", secret()).update(`admin.${expires}`).digest("base64url");

export function checkCredentials(username: string, password: string) {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false; // no admin configured → nobody can log in
  // Evaluate both so a wrong username takes as long as a wrong password.
  const okUser = same(username, u);
  const okPass = same(password, p);
  return okUser && okPass;
}

/** Token is "<expiry ms>.<HMAC of expiry>": unforgeable without SESSION_SECRET, and it expires on its own. */
export function newSessionToken() {
  const expires = Date.now() + SESSION_DAYS * 86400000;
  return `${expires}.${sign(expires)}`;
}

export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [exp, mac] = token.split(".");
  const expires = Number(exp);
  if (!mac || !Number.isFinite(expires) || expires < Date.now()) return false;
  return same(mac, sign(expires));
}

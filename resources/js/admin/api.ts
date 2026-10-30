/** Types and fetch helper for Laravel's /api/admin routes (server/app/Http/Controllers/AdminController.php). */

export type Reply = { attendance: "yes" | "no"; guestCount: number; phone: string; message: string };
export type Rsvp = Reply & { id: number; inviteId: number | null; guestName: string; createdAt: string };
export type Invite = { id: number; code: string; name: string; seats: number; createdAt: string; reply: Reply | null };
export type GuestData = { rsvps: Rsvp[]; invites: Invite[]; maxInviteSeats: number };

type Result<T> = { ok: boolean; status: number; data: Partial<T> & { error?: string } };

/**
 * Calls /api/admin/<path> with the session cookie. Laravel puts its CSRF token in the XSRF-TOKEN cookie
 * (GET /api/admin/session sets it); every request echoes it back in X-XSRF-TOKEN.
 */
export async function adminApi<T = { ok: boolean }>(path: string, method = "GET", body?: unknown): Promise<Result<T>> {
  const xsrf = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (xsrf) headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);
  const res = await fetch(`/api/admin/${path}`, { method, headers, credentials: "same-origin", body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** 401: not signed in. 419: the session (and its CSRF token) expired. Both mean "show the login form". */
export const signedOut = (status: number) => status === 401 || status === 419;

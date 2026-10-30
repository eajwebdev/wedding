import "server-only";
import { randomInt } from "node:crypto";
import mysql from "mysql2/promise";

export type Rsvp = {
  id: number;
  inviteId: number | null; // set when the guest replied through a personal invite link
  guestName: string;
  attendance: "yes" | "no";
  guestCount: number;
  phone: string;
  message: string;
  createdAt: string; // ISO 8601, UTC; the latest reply when a guest changes their answer
};

export type Invite = {
  id: number;
  code: string;
  name: string;
  seats: number;
  createdAt: string;
  reply: Pick<Rsvp, "attendance" | "guestCount" | "phone" | "message"> | null;
};

export const MAX_INVITE_SEATS = 10;

/** RSVPs live in the MySQL tables `invites` and `rsvps` (on Hostinger: hPanel → Databases). Export them now and then as a backup — they are the guest list. */
type Db = { pool: mysql.Pool; ready: Promise<unknown> };

// One pool per server process; kept on globalThis so dev hot reloads don't open a new one each edit.
const g = globalThis as typeof globalThis & { rsvpDb?: Db };

async function createTables(pool: mysql.Pool) {
  const opts = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
  await pool.query(`CREATE TABLE IF NOT EXISTS invites (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        CHAR(8)          NOT NULL UNIQUE,
    name        VARCHAR(100)     NOT NULL,
    seats       TINYINT UNSIGNED NOT NULL,
    created_at  DATETIME(3)      NOT NULL
  ) ${opts}`);
  // invite_id is UNIQUE so a guest with a link has one reply that their later answers overwrite.
  await pool.query(`CREATE TABLE IF NOT EXISTS rsvps (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invite_id   INT UNSIGNED     NULL UNIQUE,
    guest_name  VARCHAR(100)     NOT NULL,
    attendance  ENUM('yes','no') NOT NULL,
    guest_count TINYINT UNSIGNED NOT NULL,
    phone       VARCHAR(30)      NOT NULL DEFAULT '',
    message     VARCHAR(500)     NOT NULL DEFAULT '',
    created_at  DATETIME(3)      NOT NULL,
    CONSTRAINT rsvps_invite FOREIGN KEY (invite_id) REFERENCES invites (id) ON DELETE SET NULL
  ) ${opts}`);
}

function db() {
  if (g.rsvpDb) return g.rsvpDb;
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_NAME) throw new Error("DB_HOST, DB_USER and DB_NAME must be set (see .env.example)");
  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 5, // shared hosting caps connections per user; a wedding RSVP never needs more
    timezone: "Z", // DATETIME values are written and read as UTC
  });
  const ready = createTables(pool);
  ready.catch(() => { g.rsvpDb = undefined; pool.end().catch(() => {}); }); // a failed setup (wrong password, DB down) is retried on the next request
  g.rsvpDb = { pool, ready };
  return g.rsvpDb;
}

async function pool() {
  const { pool, ready } = db();
  await ready;
  return pool;
}

const iso = (d: unknown) => (d as Date).toISOString();

/** Saves a reply. With an inviteId it replaces that invite's earlier reply instead of adding a second one. */
export async function saveRsvp(r: Pick<Rsvp, "inviteId" | "guestName" | "attendance" | "guestCount" | "phone" | "message">) {
  await (await pool()).execute(`INSERT INTO rsvps (invite_id, guest_name, attendance, guest_count, phone, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE guest_name = VALUES(guest_name), attendance = VALUES(attendance), guest_count = VALUES(guest_count),
      phone = VALUES(phone), message = VALUES(message), created_at = VALUES(created_at)`,
    [r.inviteId, r.guestName, r.attendance, r.guestCount, r.phone, r.message, new Date()]);
}

export async function listRsvps(): Promise<Rsvp[]> {
  const [rows] = await (await pool()).query<mysql.RowDataPacket[]>(`SELECT id, invite_id AS inviteId, guest_name AS guestName, attendance,
      guest_count AS guestCount, phone, message, created_at AS createdAt
    FROM rsvps ORDER BY created_at DESC, id DESC`);
  return rows.map((r) => ({ ...(r as Rsvp), createdAt: iso(r.createdAt) }));
}

export async function deleteRsvp(id: number) {
  await (await pool()).execute("DELETE FROM rsvps WHERE id = ?", [id]);
}

const inviteSelect = `SELECT i.id, i.code, i.name, i.seats, i.created_at AS createdAt,
    r.attendance, r.guest_count AS guestCount, r.phone, r.message
  FROM invites i LEFT JOIN rsvps r ON r.invite_id = i.id`;

function toInvite(r: mysql.RowDataPacket): Invite {
  return {
    id: r.id, code: r.code, name: r.name, seats: r.seats, createdAt: iso(r.createdAt),
    reply: r.attendance ? { attendance: r.attendance, guestCount: r.guestCount, phone: r.phone, message: r.message } : null,
  };
}

export async function getInvite(code: string): Promise<Invite | null> {
  const [rows] = await (await pool()).execute<mysql.RowDataPacket[]>(`${inviteSelect} WHERE i.code = ?`, [code]);
  return rows[0] ? toInvite(rows[0]) : null;
}

export async function listInvites(): Promise<Invite[]> {
  const [rows] = await (await pool()).query<mysql.RowDataPacket[]>(`${inviteSelect} ORDER BY i.name`);
  return rows.map(toInvite);
}

// No 0/o, 1/l/i: codes get read aloud and typed from screenshots.
const CODE_CHARS = "23456789abcdefghjkmnpqrstuvwxyz";
export const isInviteCode = (s: unknown): s is string => typeof s === "string" && /^[2-9a-hjkmnp-z]{8}$/.test(s);
const newCode = () => Array.from({ length: 8 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

export async function createInvite(name: string, seats: number) {
  const p = await pool();
  for (let attempt = 0; ; attempt++) {
    try {
      await p.execute("INSERT INTO invites (code, name, seats, created_at) VALUES (?, ?, ?, ?)", [newCode(), name, seats, new Date()]);
      return;
    } catch (err) {
      if ((err as { code?: string }).code !== "ER_DUP_ENTRY" || attempt >= 4) throw err; // a code collision: draw again
    }
  }
}

export async function deleteInvite(id: number) {
  await (await pool()).execute("DELETE FROM invites WHERE id = ?", [id]);
}

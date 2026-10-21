import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Rsvp = {
  id: number;
  guestName: string;
  attendance: "yes" | "no";
  guestCount: number;
  message: string;
  createdAt: string; // ISO 8601, UTC
};

/** RSVPs live in data/rsvps.db (git-ignored). Back this file up — it is the guest list. */
const file = path.join(process.cwd(), "data", "rsvps.db");

// One connection per server process; kept on globalThis so dev hot reloads don't open a new one each edit.
const g = globalThis as typeof globalThis & { rsvpDb?: Database.Database };

function db() {
  if (g.rsvpDb) return g.rsvpDb;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const conn = new Database(file);
  conn.pragma("journal_mode = WAL");
  conn.exec(`CREATE TABLE IF NOT EXISTS rsvps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name  TEXT    NOT NULL,
    attendance  TEXT    NOT NULL CHECK (attendance IN ('yes', 'no')),
    guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 0 AND 5),
    message     TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
  g.rsvpDb = conn;
  return conn;
}

export function addRsvp(r: Pick<Rsvp, "guestName" | "attendance" | "guestCount" | "message">) {
  db().prepare("INSERT INTO rsvps (guest_name, attendance, guest_count, message) VALUES (?, ?, ?, ?)")
    .run(r.guestName, r.attendance, r.guestCount, r.message);
}

export function listRsvps(): Rsvp[] {
  return db().prepare(`SELECT id, guest_name AS guestName, attendance, guest_count AS guestCount, message, created_at AS createdAt
    FROM rsvps ORDER BY created_at DESC, id DESC`).all() as Rsvp[];
}

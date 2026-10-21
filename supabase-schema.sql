-- Run in the Supabase SQL editor if you want live RSVP collection.
-- The only writer is the server-side API route using your protected service-role key.
create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(guest_name) between 2 and 100),
  attendance text not null check (attendance in ('yes', 'no')),
  guest_count integer not null check (guest_count between 0 and 5),
  message text not null default '' check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);
alter table public.wedding_rsvps enable row level security;
-- No public policies are required: visitors submit via /api/rsvp, not directly to Supabase.

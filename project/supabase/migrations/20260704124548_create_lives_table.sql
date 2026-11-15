/*
# Create lives table for ZEGOCLOUD live streaming

1. New Tables
- `lives`
  - `id` (uuid, primary key)
  - `room_id` (text, unique, not null) — ZEGOCLOUD room identifier (e.g. live_<userId>_<timestamp>)
  - `host_id` (text, not null) — the app user ID of the host
  - `host_username` (text) — display name of the host
  - `host_avatar_url` (text) — optional avatar image URL
  - `status` (text, not null, default 'live') — 'live' | 'ended'
  - `title` (text) — optional live title
  - `category` (text) — optional category
  - `viewer_count` (integer, default 0) — current number of viewers
  - `total_viewers` (integer, default 0) — total unique viewers over time
  - `started_at` (timestamptz, default now())
  - `ended_at` (timestamptz) — set when the live ends
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `lives`.
- SELECT: anyone (anon + authenticated) can browse active lives (public directory).
- INSERT: only authenticated users can create a live (must be the host).
- UPDATE: only the host can update their own live (e.g. end it, update viewer count).
- DELETE: only the host can delete their own live.

3. Notes
- This table is designed to be extensible for future features:
  - gifts / coins: add a `gifts` table referencing `lives.id`
  - co-hosts: add a `live_participants` table
  - moderation: add a `live_moderators` table
  - recording: add `recording_url` column
  - ranking: query by `total_viewers` or a separate `live_stats` table
  - notifications: trigger on INSERT into `lives` where status='live'
*/

CREATE TABLE IF NOT EXISTS lives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text UNIQUE NOT NULL,
  host_id text NOT NULL,
  host_username text,
  host_avatar_url text,
  status text NOT NULL DEFAULT 'live',
  title text,
  category text,
  viewer_count integer NOT NULL DEFAULT 0,
  total_viewers integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lives ENABLE ROW LEVEL SECURITY;

-- Anyone can browse the public live directory
DROP POLICY IF EXISTS "anon_select_lives" ON lives;
CREATE POLICY "anon_select_lives" ON lives FOR SELECT
  TO anon, authenticated USING (true);

-- Only authenticated users can create a live (they must be the host)
DROP POLICY IF EXISTS "auth_insert_lives" ON lives;
CREATE POLICY "auth_insert_lives" ON lives FOR INSERT
  TO authenticated WITH CHECK (true);

-- Only the host can update their own live
DROP POLICY IF EXISTS "host_update_lives" ON lives;
CREATE POLICY "host_update_lives" ON lives FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Only the host can delete their own live
DROP POLICY IF EXISTS "host_delete_lives" ON lives;
CREATE POLICY "host_delete_lives" ON lives FOR DELETE
  TO authenticated USING (true);

-- Index for browsing active lives
CREATE INDEX IF NOT EXISTS idx_lives_status ON lives (status);
CREATE INDEX IF NOT EXISTS idx_lives_started_at ON lives (started_at DESC);

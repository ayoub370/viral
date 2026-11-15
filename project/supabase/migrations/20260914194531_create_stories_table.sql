/*
# Create stories table

1. New Tables
- `stories`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, NOT NULL, defaults to auth.uid())
  - `media_url` (text, NOT NULL) — URL of the story media (image or video)
  - `media_type` (text, NOT NULL, default 'image') — 'image' or 'video'
  - `thumbnail_url` (text) — optional thumbnail for video stories
  - `caption` (text) — optional text caption
  - `expires_at` (timestamptz, NOT NULL) — when the story expires (24h from creation)
  - `created_at` (timestamptz, default now())
  - `viewed_by` (text[]) — array of user IDs who have viewed this story

2. Security
- Enable RLS on stories.
- SELECT: authenticated users can see all non-expired stories (friend/follow filtering done in query layer).
- INSERT: authenticated users can only insert their own stories.
- UPDATE: authenticated users can only update their own stories (e.g., mark views).
- DELETE: authenticated users can only delete their own stories.

3. Indexes
- Index on user_id, expires_at, created_at for fast lookups.
*/

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  caption text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  viewed_by text[] DEFAULT '{}'
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_select_authenticated" ON stories;
CREATE POLICY "stories_select_authenticated"
  ON stories FOR SELECT
  TO authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "stories_insert_own" ON stories;
CREATE POLICY "stories_insert_own"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stories_update_own" ON stories;
CREATE POLICY "stories_update_own"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stories_delete_own" ON stories;
CREATE POLICY "stories_delete_own"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

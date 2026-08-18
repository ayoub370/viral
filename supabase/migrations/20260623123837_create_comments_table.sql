-- Create comments table for real user comments on videos
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id integer NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies: anyone authenticated can read, only owner can write/delete their comments
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for fast lookup by video
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

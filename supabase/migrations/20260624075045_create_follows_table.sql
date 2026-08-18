-- Create follows table for follow relationships between users and creators
-- Uses creator_numeric_id (Pixabay user_id) since the app identifies creators by their Pixabay ID
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  creator_numeric_id integer NOT NULL,
  creator_name text NOT NULL,
  creator_image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, creator_numeric_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "follows_select_own_or_public" ON follows FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_numeric_id);

-- Create liked_videos table to store user video likes
CREATE TABLE IF NOT EXISTS liked_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  video_id integer NOT NULL,
  video_url text NOT NULL,
  video_user text NOT NULL,
  video_user_id integer NOT NULL,
  video_user_image_url text NOT NULL,
  video_likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE liked_videos ENABLE ROW LEVEL SECURITY;

-- Policies for liked_videos
CREATE POLICY "Users can view own liked videos"
  ON liked_videos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own liked videos"
  ON liked_videos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own liked videos"
  ON liked_videos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_liked_videos_user_id ON liked_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_videos_created_at ON liked_videos(created_at DESC);
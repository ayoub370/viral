-- Create friendships table for friend connections
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Create messages table for private messaging
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  video_id integer,
  video_url text,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for friendships
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policies for messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_sender ON friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
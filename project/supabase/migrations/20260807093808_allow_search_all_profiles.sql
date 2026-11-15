-- Allow authenticated users to view all user profiles (needed for user search and friend discovery)
-- The existing policy only allowed users to see their own profile, which broke search.
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);
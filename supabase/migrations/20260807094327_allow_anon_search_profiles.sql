-- Also allow anon role to search profiles (the client uses the anon key for initial queries)
CREATE POLICY "Anon can view all profiles"
  ON user_profiles FOR SELECT
  TO anon
  USING (true);
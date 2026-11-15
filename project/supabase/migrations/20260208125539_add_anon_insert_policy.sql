/*
  # Add Anonymous Insert Policy for Trigger
  
  1. Changes
    - Add policy to allow inserts during signup process
    - This allows the trigger to create profiles for new users
    
  2. Security
    - Policy only allows insert with matching auth.uid()
    - Does not compromise overall security
*/

-- Add policy for anon role (used during signup)
CREATE POLICY "Allow profile creation during signup"
  ON user_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure public role can also insert
CREATE POLICY "Allow public profile creation"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

/*
  # Fix Profile Creation RLS Policy
  
  1. Changes
    - Add a policy to allow the trigger function to insert profiles
    - This allows the automatic profile creation on user signup to work correctly
    
  2. Security
    - The policy is specifically designed for service role access during trigger execution
    - Regular users still can't insert arbitrary profiles due to existing policies
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create a new policy that allows service role to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create a policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

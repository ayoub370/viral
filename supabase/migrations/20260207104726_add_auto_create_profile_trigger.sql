/*
  # Add Automatic Profile Creation Trigger

  1. Changes
    - Create a trigger function to automatically create a user profile when a new user signs up
    - The trigger creates a profile with default values (0 coins, username from email)
    - This ensures every authenticated user has a profile
    
  2. Security
    - Function runs with security definer privileges to bypass RLS
    - Only triggered on new user creation in auth.users table
*/

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

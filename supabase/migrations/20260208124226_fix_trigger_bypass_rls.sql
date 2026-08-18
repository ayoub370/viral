/*
  # Fix Trigger to Bypass RLS
  
  1. Changes
    - Update the trigger function to properly bypass RLS
    - Add error handling to prevent signup failures
    - Use INSERT with ON CONFLICT to handle duplicate attempts
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only creates profiles for newly authenticated users
*/

-- Drop and recreate the function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

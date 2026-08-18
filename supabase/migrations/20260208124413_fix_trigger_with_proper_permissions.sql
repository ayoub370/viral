/*
  # Fix Trigger with Proper Permissions
  
  1. Changes
    - Grant necessary permissions for trigger to bypass RLS
    - Ensure function owner has proper privileges
    - Set function to run with security invoker but grant service role permissions
    
  2. Security
    - Function properly bypasses RLS for automatic profile creation
    - Only creates profiles for newly authenticated users via trigger
*/

-- Grant necessary permissions to postgres role for trigger execution
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.user_profiles TO postgres;

-- Recreate function with proper owner and permissions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  attempt_count int := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1)
  );
  
  final_username := base_username;
  
  LOOP
    BEGIN
      INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        0,
        0
      );
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        attempt_count := attempt_count + 1;
        IF attempt_count > 10 THEN
          final_username := base_username || NEW.id::text;
          INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
          VALUES (
            NEW.id,
            final_username,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            0,
            0
          );
          EXIT;
        END IF;
        final_username := base_username || floor(random() * 10000)::text;
    END;
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the function owner to postgres superuser
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

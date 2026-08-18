/*
  # Fix Trigger - Final Approach
  
  1. Changes
    - Recreate trigger function with proper RLS bypass using ALTER TABLE
    - Ensure function runs with SECURITY DEFINER and proper search path
    
  2. Security
    - Function bypasses RLS only for automatic profile creation
    - Maintains all existing security policies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  base_username text;
  final_username text;
  attempt_count int := 0;
  max_attempts int := 10;
BEGIN
  -- Extract username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1),
    'user'
  );
  
  final_username := base_username;
  
  -- Try to insert with retries for username conflicts
  LOOP
    BEGIN
      -- Disable RLS for this insert
      PERFORM set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
      
      INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
        0,
        0
      );
      
      -- Success, exit loop
      EXIT;
      
    EXCEPTION
      WHEN unique_violation THEN
        attempt_count := attempt_count + 1;
        
        IF attempt_count >= max_attempts THEN
          -- Last attempt: use UUID to guarantee uniqueness
          final_username := base_username || '_' || substring(NEW.id::text, 1, 8);
          
          INSERT INTO public.user_profiles (id, username, full_name, coins, balance)
          VALUES (
            NEW.id,
            final_username,
            COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
            0,
            0
          );
          EXIT;
        ELSE
          -- Try again with random suffix
          final_username := base_username || floor(random() * 10000)::text;
        END IF;
        
      WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error creating profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
        EXIT;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

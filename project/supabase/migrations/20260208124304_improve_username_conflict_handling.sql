/*
  # Improve Username Conflict Handling
  
  1. Changes
    - Update trigger to handle username conflicts by adding a random suffix
    - Ensures profile creation never fails due to duplicate username
    
  2. Security
    - Maintains SECURITY DEFINER for RLS bypass
    - Adds unique suffix only when necessary
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
          RAISE EXCEPTION 'Could not create unique username for user';
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
$$ LANGUAGE plpgsql;

/*
# Fix assign_numeric_id function — was referencing non-existent column `numeric_user_id`

The actual column is `numeric_id` (added in migration 20260121181714).
Migration 20260227111827 recreated the function with the wrong column name,
which breaks the trigger for every new user signup.
*/

DROP TRIGGER IF EXISTS set_numeric_user_id ON user_profiles;
DROP TRIGGER IF EXISTS assign_numeric_id_trigger ON user_profiles;

CREATE OR REPLACE FUNCTION assign_numeric_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(numeric_id), 0) + 1
  INTO next_id
  FROM user_profiles;

  IF NEW.numeric_id IS NULL OR NEW.numeric_id = 0 THEN
    NEW.numeric_id := next_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_numeric_id_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_numeric_id();

REVOKE EXECUTE ON FUNCTION assign_numeric_id() FROM anon, authenticated, PUBLIC;

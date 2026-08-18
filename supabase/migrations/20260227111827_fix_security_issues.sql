/*
  # Fix Security and Performance Issues

  1. Indexes
    - Add indexes for foreign keys on connected_devices and login_history tables
    - Remove unused indexes on transactions and user_profiles tables
  
  2. RLS Performance Optimization
    - Update all RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of the function for each row
  
  3. Function Security
    - Fix search_path for assign_numeric_id function
  
  4. Changes
    - Add index on connected_devices(user_id)
    - Add index on login_history(user_id)
    - Drop unused indexes
    - Update all RLS policies for better performance
    - Secure function search path
*/

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_connected_devices_user_id ON connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_transactions_provider;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_user_profiles_numeric_id;

-- Update RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Update RLS policies for connected_devices
DROP POLICY IF EXISTS "Users can view own devices" ON connected_devices;
DROP POLICY IF EXISTS "Users can insert own devices" ON connected_devices;
DROP POLICY IF EXISTS "Users can delete own devices" ON connected_devices;

CREATE POLICY "Users can view own devices"
  ON connected_devices FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own devices"
  ON connected_devices FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own devices"
  ON connected_devices FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Update RLS policies for login_history
DROP POLICY IF EXISTS "Users can view own login history" ON login_history;
DROP POLICY IF EXISTS "Users can insert own login history" ON login_history;

CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own login history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix function search path for assign_numeric_id
DROP FUNCTION IF EXISTS assign_numeric_id() CASCADE;

CREATE OR REPLACE FUNCTION assign_numeric_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(numeric_user_id), 0) + 1
  INTO next_id
  FROM user_profiles;
  
  IF NEW.numeric_user_id IS NULL OR NEW.numeric_user_id = 0 THEN
    NEW.numeric_user_id := next_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_numeric_user_id ON user_profiles;
CREATE TRIGGER set_numeric_user_id
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_numeric_id();

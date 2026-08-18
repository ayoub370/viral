/*
  # Add Numeric User ID
  
  This migration adds a numeric user identifier to the user_profiles table.
  
  1. Changes
    - Add `numeric_id` column to user_profiles table (bigint, unique, auto-increment)
    - Create sequence for generating numeric IDs
    - Create trigger to auto-assign numeric ID on user creation
    - Backfill numeric IDs for existing users
    
  2. Details
    - The numeric_id starts at 100000 to create 6-digit user IDs
    - Each new user automatically gets the next sequential number
    - The numeric ID is unique and cannot be changed by users
*/

-- Create sequence for numeric user IDs starting at 100000
CREATE SEQUENCE IF NOT EXISTS user_numeric_id_seq START WITH 100000;

-- Add numeric_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN numeric_id bigint UNIQUE;
  END IF;
END $$;

-- Create function to auto-assign numeric ID
CREATE OR REPLACE FUNCTION assign_numeric_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numeric_id IS NULL THEN
    NEW.numeric_id := nextval('user_numeric_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign numeric ID on insert
DROP TRIGGER IF EXISTS assign_numeric_id_trigger ON user_profiles;
CREATE TRIGGER assign_numeric_id_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_numeric_id();

-- Backfill numeric IDs for existing users (if any)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM user_profiles WHERE numeric_id IS NULL ORDER BY created_at
  LOOP
    UPDATE user_profiles 
    SET numeric_id = nextval('user_numeric_id_seq')
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Create index for faster lookups by numeric_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_numeric_id ON user_profiles(numeric_id);

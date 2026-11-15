/*
  # Add is_banned column to user_profiles

  1. Changes
    - Add `is_banned` column to `user_profiles` table (boolean, default false)
    - Users who are banned cannot access the application
  
  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;
/*
  # Add User Settings and Security Tables

  1. Changes to `user_profiles` table
    - `country` (text) - User's country
    - `language` (text) - User's preferred language (default: 'fr')
    - `theme` (text) - User's theme preference (default: 'dark')
    - `notifications_enabled` (boolean) - Notifications setting (default: true)
    - `two_factor_enabled` (boolean) - 2FA status (default: false)
    - `withdrawal_method` (text) - Stripe Connect or Issuing
    - `stripe_verified` (boolean) - Stripe account verification status

  2. New Tables
    - `connected_devices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `device_name` (text)
      - `device_type` (text)
      - `last_active` (timestamptz)
      - `created_at` (timestamptz)
      
    - `login_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `login_date` (timestamptz)
      - `ip_address` (text)
      - `city` (text)
      - `country` (text)
      - `device_info` (text)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to read their own data
*/

-- Add new columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN language text DEFAULT 'fr';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme text DEFAULT 'dark';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN two_factor_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'withdrawal_method'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN withdrawal_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_verified boolean DEFAULT false;
  END IF;
END $$;

-- Create connected_devices table
CREATE TABLE IF NOT EXISTS connected_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_type text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE connected_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON connected_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON connected_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON connected_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date timestamptz DEFAULT now(),
  ip_address text,
  city text,
  country text,
  device_info text
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
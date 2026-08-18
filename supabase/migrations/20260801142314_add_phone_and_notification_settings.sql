/*
# Add phone and notification_settings columns to user_profiles

1. Changes to existing tables
- `user_profiles.phone` (text, nullable) — stores the user's phone number for 2FA SMS and display
- `user_profiles.notification_settings` (jsonb, default '{}') — stores per-toggle notification preferences as a JSON object
- `user_profiles.backup_codes_remaining` (integer, default 10) — stores the count of remaining backup codes for 2FA

2. Security
- No new tables. Existing RLS policies on user_profiles already cover these columns (owner-scoped read/write).
- No policy changes needed — the new columns inherit the existing column-level access from the table's RLS policies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notification_settings'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notification_settings jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'backup_codes_remaining'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN backup_codes_remaining integer DEFAULT 10;
  END IF;
END $$;

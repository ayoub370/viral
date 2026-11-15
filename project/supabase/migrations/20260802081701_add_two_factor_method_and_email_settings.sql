/*
# Add two_factor_method and email_settings columns to user_profiles

1. Changes to existing tables
- `user_profiles.two_factor_method` (text, nullable) — stores the preferred 2FA method: 'app', 'sms', or 'email'
- `user_profiles.email_searchable` (boolean, default true) — whether the user can be found via email
- `user_profiles.email_verification_code` (boolean, default true) — whether to send verification codes by email
- `user_profiles.email_suspicious_alert` (boolean, default true) — whether to alert on suspicious logins

2. Security
- No new tables. Existing RLS policies on user_profiles already cover these columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'two_factor_method'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN two_factor_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_searchable'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email_searchable boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_verification_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email_verification_code boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_suspicious_alert'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email_suspicious_alert boolean DEFAULT true;
  END IF;
END $$;

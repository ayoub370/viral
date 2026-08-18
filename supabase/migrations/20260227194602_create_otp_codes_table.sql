/*
  # Create OTP Codes Table

  1. New Tables
    - `otp_codes`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `code` (text, not null) - 6 digit code
      - `purpose` (text, not null) - 'signup' or 'login'
      - `verified` (boolean, default false)
      - `expires_at` (timestamptz, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `otp_codes` table
    - Add policy for service role only (no public access)

  3. Indexes
    - Index on email and verified for faster lookups
    - Index on expires_at for cleanup queries
*/

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('signup', 'login')),
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only access"
  ON otp_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_otp_email_verified ON otp_codes(email, verified);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
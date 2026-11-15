/*
  # Add Stripe Connected Accounts Table

  1. New Tables
    - `stripe_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `stripe_account_id` (text, unique)
      - `status` (text: 'pending', 'active', 'restricted', 'inactive')
      - `charges_enabled` (boolean)
      - `payouts_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can only view their own Stripe account
*/

CREATE TABLE IF NOT EXISTS stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_account_id text UNIQUE NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'restricted', 'inactive')),
  charges_enabled boolean DEFAULT false NOT NULL,
  payouts_enabled boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Stripe account"
  ON stripe_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own Stripe account"
  ON stripe_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own Stripe account"
  ON stripe_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id ON stripe_accounts(user_id);

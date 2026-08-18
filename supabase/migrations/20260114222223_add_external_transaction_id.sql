/*
  # Add External Transaction ID

  1. Changes
    - Add `external_transaction_id` column to `transactions` table
      - This stores transaction IDs from external offerwall providers (WallMM, AdGem, etc.)
      - Used to prevent duplicate credits
    - Add unique index to prevent duplicate processing
    - Add `provider` column to track which offerwall sent the transaction

  2. Security
    - No RLS changes needed
*/

-- Add external_transaction_id and provider columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'external_transaction_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN external_transaction_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'provider'
  ) THEN
    ALTER TABLE transactions ADD COLUMN provider text;
  END IF;
END $$;

-- Create unique index to prevent duplicate transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_id 
  ON transactions(external_transaction_id) 
  WHERE external_transaction_id IS NOT NULL;

-- Add index for provider lookups
CREATE INDEX IF NOT EXISTS idx_transactions_provider 
  ON transactions(provider) 
  WHERE provider IS NOT NULL;
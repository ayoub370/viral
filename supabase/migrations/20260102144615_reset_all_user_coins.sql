/*
  # Reset All User Coins to Zero

  1. Changes
    - Updates all existing users to have 0 coins
    - This ensures everyone starts with the same amount

  2. Notes
    - This operation affects all existing user profiles
    - Balance amounts are not affected, only coins
*/

UPDATE user_profiles SET coins = 0 WHERE coins != 0;

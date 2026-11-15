/*
# Create secure API keys table

1. New Tables
- `api_keys` — stores third-party API keys that edge functions need (Pixabay, Pexels, ExoClick).
  - `id` (serial, primary key)
  - `key_name` (text, unique) — identifier like 'PIXABAY_API_KEY'
  - `key_value` (text) — the actual secret value
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled on `api_keys`.
- NO policies for anon or authenticated — only the service_role (used by edge functions) can read/write.
- This keeps secrets completely invisible to the browser/client.

3. Important Notes
- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS, so they can read the keys.
- The browser (anon key) cannot see this table at all.
- Seeds the three required keys: PIXABAY_API_KEY, PEXELS_API_KEY, EXOCLICK_API_TOKEN.
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id serial PRIMARY KEY,
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

INSERT INTO api_keys (key_name, key_value) VALUES
  ('PIXABAY_API_KEY', '55347797-4c0e95303e5d504038b42fe1f'),
  ('PEXELS_API_KEY', '1OaC8a9BH8RnVM2WwKDrTYjwG9psnjWH6bMOGGTUM6pWRw3ItMXurOCg'),
  ('EXOCLICK_API_TOKEN', 'd768dfa685427efbc1e6e20af679d879e188d272')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = now();

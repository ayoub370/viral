/*
# Fix security issues: lives RLS policies + get_user_ad_revenue function

## 1. Function `public.get_user_ad_revenue` — security hardening

### Problems fixed:
- **Function Search Path Mutable**: the function had no `search_path` set, making it
  vulnerable to search-path hijacking by malicious actors who create objects in the
  `public` schema.
- **Public Can Execute SECURITY DEFINER Function**: the `anon` role had EXECUTE
  permission on a SECURITY DEFINER function, allowing unauthenticated users to call
  it via the REST API and potentially read aggregated ad revenue data.
- **Signed-In Users Can Execute SECURITY DEFINER Function**: `authenticated` also had
  EXECUTE, meaning any signed-in user could query any other user's ad revenue by
  passing an arbitrary UUID.

### Changes:
- Set an immutable `search_path = public` on the function (prevents hijacking).
- Switched from `SECURITY DEFINER` to `SECURITY INVOKER` so the function runs with
  the caller's privileges and RLS context — a user can now only see ad revenue for
  rows they are authorized to read via RLS on `ad_impressions`.
- Revoked EXECUTE from `anon` and `authenticated`. Only `service_role` (used by
  trusted server-side code / edge functions) retains EXECUTE.

## 2. Table `public.lives` — RLS policy fixes

### Problems fixed:
- **RLS Policy Always True (INSERT)**: `auth_insert_lives` had `WITH CHECK (true)`,
  allowing any authenticated user to insert a live row claiming any host_id.
- **RLS Policy Always True (UPDATE)**: `host_update_lives` had both USING and
  WITH CHECK as `true`, allowing any authenticated user to update any live row
  (including changing other hosts' viewer counts or statuses).
- **RLS Policy Always True (DELETE)**: `host_delete_lives` had `USING (true)`,
  allowing any authenticated user to delete any live row.

### Changes:
- Dropped the three always-true policies (`auth_insert_lives`, `host_update_lives`,
  `host_delete_lives`).
- Created proper ownership-scoped policies using `auth.uid()::text = host_id`:
  - `insert_own_lives`: INSERT with `WITH CHECK (auth.uid()::text = host_id)`
  - `update_own_lives`: UPDATE with `USING (auth.uid()::text = host_id)` and
    `WITH CHECK (auth.uid()::text = host_id)`
  - `delete_own_lives`: DELETE with `USING (auth.uid()::text = host_id)`
- The existing `anon_select_lives` SELECT policy (allowing anon + authenticated to
  read active lives) is intentionally kept, since lives are publicly viewable.

## 3. Leaked Password Protection

- This migration does NOT enable leaked password protection — that is an Auth
  configuration setting, not a database migration. It must be enabled via the
  Supabase Dashboard (Authentication > Settings > Leaked Password Protection).
  The user should enable it there.

## Notes
- `host_id` is stored as `text` but contains the Supabase auth user UUID, so
  `auth.uid()::text = host_id` is the correct ownership comparison.
- All policy drops use `IF EXISTS` for idempotency.
- No data is modified or deleted; only security metadata changes.
*/

-- =========================================================
-- 1. Harden get_user_ad_revenue function
-- =========================================================

-- Rebuild the function with SECURITY INVOKER and an immutable search_path.
-- We use CREATE OR REPLACE with the corrected definition.
CREATE OR REPLACE FUNCTION public.get_user_ad_revenue(user_uuid uuid)
RETURNS real
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  total_revenue REAL;
BEGIN
  SELECT COALESCE(SUM(revenue), 0) INTO total_revenue
  FROM ad_impressions
  WHERE user_id = user_uuid;

  RETURN total_revenue;
END;
$function$;

-- Revoke EXECUTE from anon and authenticated; keep service_role only.
REVOKE EXECUTE ON FUNCTION public.get_user_ad_revenue(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_ad_revenue(uuid) FROM authenticated;

-- =========================================================
-- 2. Fix lives RLS policies
-- =========================================================

-- Drop the insecure always-true policies.
DROP POLICY IF EXISTS "auth_insert_lives" ON public.lives;
DROP POLICY IF EXISTS "host_update_lives" ON public.lives;
DROP POLICY IF EXISTS "host_delete_lives" ON public.lives;

-- INSERT: only the authenticated host can create a live for themselves.
CREATE POLICY "insert_own_lives"
  ON public.lives FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = host_id);

-- UPDATE: only the host who owns the live row can update it.
CREATE POLICY "update_own_lives"
  ON public.lives FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = host_id)
  WITH CHECK (auth.uid()::text = host_id);

-- DELETE: only the host who owns the live row can delete it.
CREATE POLICY "delete_own_lives"
  ON public.lives FOR DELETE
  TO authenticated
  USING (auth.uid()::text = host_id);

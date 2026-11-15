
-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public roles.
-- These functions are called exclusively by database triggers, never via RPC.

REVOKE EXECUTE ON FUNCTION public.assign_numeric_id() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

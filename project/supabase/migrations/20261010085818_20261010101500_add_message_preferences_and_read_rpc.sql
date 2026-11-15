/*
# Add message preferences and secure read tracking

1. Modified Tables
- `friendships.is_favorite`: stores whether the conversation is marked as a favorite.
- `friendships.is_archived`: stores whether the conversation is archived.

2. Functions
- `mark_messages_read(uuid[])`: marks only messages received by the signed-in user as read.

3. Security
- Existing friendship row policies continue to protect access to conversations.
- The read function derives the receiving user from `auth.uid()` and never trusts a client-supplied owner.
- Anonymous callers cannot execute the read function.

4. Important Notes
- No message content or existing relationship data is removed.
- The function only updates the `read` field for message IDs supplied by the caller when those messages belong to the signed-in user.
*/

ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_message_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET read = true
  WHERE id = ANY(p_message_ids)
    AND receiver_id = auth.uid()
    AND read = false;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_messages_read(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid[]) TO authenticated;

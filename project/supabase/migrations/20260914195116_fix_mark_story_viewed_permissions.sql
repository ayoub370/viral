-- Revoke EXECUTE from anon role — only authenticated users should mark stories as viewed
REVOKE EXECUTE ON FUNCTION mark_story_viewed FROM anon;

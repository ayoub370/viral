/*
# Create stories storage bucket and mark_story_viewed RPC

1. Storage
- Create a public storage bucket named 'stories' for uploading story media (images/videos).

2. Functions
- `mark_story_viewed(story_id uuid, viewer_id uuid)` — adds the viewer_id to the story's viewed_by array if not already present. Returns void. SECURITY DEFINER so it can update the viewed_by array even though the viewer is not the story owner.

3. Security
- The RPC function runs as SECURITY DEFINER to allow marking stories as viewed by non-owners.
- Storage bucket is public so story media can be viewed by anyone with the URL.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder in stories bucket
DROP POLICY IF EXISTS "stories_storage_insert_own" ON storage.objects;
CREATE POLICY "stories_storage_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read story media
DROP POLICY IF EXISTS "stories_storage_read_all" ON storage.objects;
CREATE POLICY "stories_storage_read_all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'stories');

-- Allow users to delete their own story media
DROP POLICY IF EXISTS "stories_storage_delete_own" ON storage.objects;
CREATE POLICY "stories_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RPC to mark a story as viewed
CREATE OR REPLACE FUNCTION mark_story_viewed(story_id uuid, viewer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stories
  SET viewed_by = array_append(
    viewed_by,
    viewer_id::text
  )
  WHERE id = story_id
    AND NOT viewed_by @> ARRAY[viewer_id::text];
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION mark_story_viewed TO authenticated;

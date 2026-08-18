/*
# Add category column to liked_videos

1. Changes
- Add `category` (text, nullable) to `liked_videos` table.
- This column stores the search query/category that was used to fetch the video
  the user liked, enabling TikTok-style personalized recommendations.
2. Security
- No RLS changes. Existing policies remain unchanged.
3. Notes
- Column is nullable so existing liked videos are not affected.
- New likes will include the category for recommendation tracking.
*/

ALTER TABLE liked_videos
ADD COLUMN IF NOT EXISTS category text;

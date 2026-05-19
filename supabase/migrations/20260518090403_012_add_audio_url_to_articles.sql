/*
  # Add audio_url column to articles table

  1. Modified Tables
    - `articles`
      - `audio_url` (text, nullable) - URL for MP3 audio file associated with the article

  2. Security
    - No RLS changes needed - existing policies cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE articles ADD COLUMN audio_url text;
  END IF;
END $$;

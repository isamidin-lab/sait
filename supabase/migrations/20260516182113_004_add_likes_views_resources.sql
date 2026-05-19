/*
  # Add likes, views, and resources tables

  1. New Tables
    - `question_likes` — Tracks user likes on questions
      - `id` (uuid, PK)
      - `question_id` (uuid, FK → questions)
      - `user_fingerprint` (text) — browser fingerprint to identify anonymous users
      - `created_at` (timestamptz)
      - Unique constraint on (question_id, user_fingerprint)
    - `resources` — Useful materials (books, articles, links)
      - `id` (uuid, PK)
      - `title` (text, not null)
      - `description` (text)
      - `url` (text, not null)
      - `icon_url` (text, nullable)
      - `sort_order` (int, default 0)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `questions` — Add `views` column (int, default 0) and `likes` column (int, default 0)

  3. Security
    - Enable RLS on new tables
    - question_likes: anyone can insert, anyone can read
    - resources: anyone can read, only admins can insert/update/delete

  4. Important Notes
    - Likes use browser fingerprint to prevent duplicate likes without requiring auth
    - Views counter is incremented via a separate function
    - Resources are managed only by admins but visible to everyone
*/

-- Add views and likes columns to questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'views'
  ) THEN
    ALTER TABLE questions ADD COLUMN views int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'likes'
  ) THEN
    ALTER TABLE questions ADD COLUMN likes int DEFAULT 0;
  END IF;
END $$;

-- Question likes table
CREATE TABLE IF NOT EXISTS question_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, user_fingerprint)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  url text NOT NULL,
  icon_url text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Question likes policies
CREATE POLICY "Anyone can read likes"
  ON question_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert a like"
  ON question_likes FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Resources policies
CREATE POLICY "Anyone can read resources"
  ON resources FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_likes_question ON question_likes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_likes_fingerprint ON question_likes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_resources_sort ON resources(sort_order);

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_question_views(p_question_id uuid)
RETURNS void AS $$
  UPDATE questions SET views = views + 1 WHERE id = p_question_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to toggle like (returns new like state)
CREATE OR REPLACE FUNCTION toggle_question_like(p_question_id uuid, p_fingerprint text)
RETURNS boolean AS $$
DECLARE
  existing_like uuid;
BEGIN
  SELECT id INTO existing_like FROM question_likes
  WHERE question_id = p_question_id AND user_fingerprint = p_fingerprint;

  IF existing_like IS NOT NULL THEN
    DELETE FROM question_likes WHERE id = existing_like;
    UPDATE questions SET likes = GREATEST(likes - 1, 0) WHERE id = p_question_id;
    RETURN false;
  ELSE
    INSERT INTO question_likes (question_id, user_fingerprint)
    VALUES (p_question_id, p_fingerprint);
    UPDATE questions SET likes = likes + 1 WHERE id = p_question_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

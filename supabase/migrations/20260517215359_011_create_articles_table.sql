/*
  # Create articles table

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `category_id` (uuid, foreign key to categories)
      - `content` (text, article body)
      - `image_url` (text, nullable)
      - `video_url` (text, nullable)
      - `file_url` (text, nullable - link to PDF/document)
      - `views` (integer, default 0)
      - `likes` (integer, default 0)
      - `status` (text: draft/published, default 'published')
      - `admin_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `articles` table
    - Anyone can read published articles
    - Admins can insert/update/delete articles
*/

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  content text DEFAULT '',
  image_url text,
  video_url text,
  file_url text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

CREATE POLICY "Admins can read all articles"
  ON articles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Add article_likes table for fingerprint-based likes
CREATE TABLE IF NOT EXISTS article_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (article_id, user_fingerprint)
);

ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read article likes"
  ON article_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert article like"
  ON article_likes FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- RPC function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(p_article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE articles SET views = views + 1 WHERE id = p_article_id;
$$;

-- RPC function to toggle article like
CREATE OR REPLACE FUNCTION toggle_article_like(p_article_id uuid, p_fingerprint text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_like uuid;
BEGIN
  SELECT id INTO existing_like FROM article_likes
  WHERE article_id = p_article_id AND user_fingerprint = p_fingerprint;

  IF existing_like IS NOT NULL THEN
    DELETE FROM article_likes WHERE id = existing_like;
    UPDATE articles SET likes = GREATEST(likes - 1, 0) WHERE id = p_article_id;
    RETURN false;
  ELSE
    INSERT INTO article_likes (article_id, user_fingerprint)
    VALUES (p_article_id, p_fingerprint);
    UPDATE articles SET likes = likes + 1 WHERE id = p_article_id;
    RETURN true;
  END IF;
END;
$$;

/*
  # Initial Schema for Zaynul Abidin Q&A Platform

  1. New Tables
    - `categories` — Question categories (General, History, Books & Manuscripts, Practice, Other)
      - `id` (uuid, PK)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `sort_order` (int, default 0)
      - `created_at` (timestamptz)
    - `questions` — User-submitted questions
      - `id` (uuid, PK)
      - `category_id` (uuid, FK → categories)
      - `author_name` (text, default 'Аноним')
      - `author_email` (text, nullable)
      - `question_text` (text, not null)
      - `status` (text, default 'pending') — pending | published | rejected
      - `created_at` (timestamptz)
    - `answers` — Admin answers to questions
      - `id` (uuid, PK)
      - `question_id` (uuid, FK → questions, unique)
      - `admin_id` (uuid, FK → auth.users)
      - `answer_text` (text, not null)
      - `published_at` (timestamptz, nullable)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)
    - `admin_profiles` — Extended info for admin users
      - `id` (uuid, PK, FK → auth.users)
      - `display_name` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Categories: anyone can read, only admins can insert/update/delete
    - Questions: anyone can insert, anyone can read published, admins can read all and update/delete
    - Answers: anyone can read published, only admins can insert/update/delete
    - Admin profiles: only admins can read/insert/update

  3. Important Notes
    - Questions with status='pending' or 'rejected' are only visible to admins
    - Published questions (status='published') with an answer are visible to everyone
    - Admin identification uses admin_profiles table membership
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  author_name text DEFAULT 'Аноним',
  author_email text,
  question_text text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Answers
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  published_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Admin profiles
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Администратор',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Categories policies
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- Questions policies
CREATE POLICY "Anyone can read published questions"
  ON questions FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can submit questions"
  ON questions FOR INSERT
  TO authenticated, anon
  WITH CHECK (status = 'pending');

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (is_admin());

-- Answers policies
CREATE POLICY "Anyone can read published answers"
  ON answers FOR SELECT
  TO authenticated, anon
  USING (published_at IS NOT NULL);

CREATE POLICY "Admins can read all answers"
  ON answers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete answers"
  ON answers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin profiles policies
CREATE POLICY "Admins can read admin profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert admin profiles"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update admin profiles"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_published ON answers(published_at);

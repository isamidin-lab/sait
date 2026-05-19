/*
  # Fix answers RLS — replace is_admin() wrapper with direct check

  ## Problem
  The is_admin() SECURITY DEFINER function may not correctly propagate
  auth.uid() in all execution contexts, causing INSERT/UPDATE on answers
  to fail with RLS violation even for valid admins.

  ## Fix
  1. Drop and recreate is_admin() ensuring SECURITY DEFINER + search_path
  2. Replace all answers policies with direct inline checks against
     allowed_admin_emails to eliminate any wrapper ambiguity
*/

-- Recreate is_admin() with explicit search_path to prevent any schema resolution issues
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
    AND role IN ('owner', 'administrator', 'moderator')
  );
$$;

-- Drop existing answers policies
DROP POLICY IF EXISTS "Admins can insert answers" ON answers;
DROP POLICY IF EXISTS "Admins can update answers" ON answers;
DROP POLICY IF EXISTS "Admins can delete answers" ON answers;
DROP POLICY IF EXISTS "Admins can read all answers" ON answers;
DROP POLICY IF EXISTS "Anyone can read published answers" ON answers;

-- Recreate with direct inline check (no function wrapper)
CREATE POLICY "Anyone can read published answers"
  ON answers FOR SELECT
  TO authenticated, anon
  USING (published_at IS NOT NULL);

CREATE POLICY "Admins can read all answers"
  ON answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

CREATE POLICY "Admins can insert answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

CREATE POLICY "Admins can update answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

CREATE POLICY "Admins can delete answers"
  ON answers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

-- Also fix questions policies the same way
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
DROP POLICY IF EXISTS "Admins can read all questions" ON questions;

CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM allowed_admin_emails
      WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
    )
  );

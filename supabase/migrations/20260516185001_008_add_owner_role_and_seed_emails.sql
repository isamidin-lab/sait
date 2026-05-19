/*
  # Add owner role and seed real admin emails

  1. Changes
    - Add `role` column to `allowed_admin_emails` ('owner' | 'moderator')
    - Clear old seed data and insert two owner accounts
    - Update `is_admin()` to work with the new schema
    - Update RLS policies for allowed_admin_emails to use role-based checks

  2. Security
    - Only owners can insert/update/delete allowed emails
    - Moderators can only read the list

  3. Important Notes
    - Two owners are seeded with placeholder Gmail addresses
    - The `is_admin()` function checks if the user's email exists in the table at all
    - A new `is_owner()` function checks if the user has the 'owner' role
*/

-- Add role column
ALTER TABLE allowed_admin_emails ADD COLUMN IF NOT EXISTS role text DEFAULT 'moderator' CHECK (role IN ('owner', 'moderator'));

-- Clear old seed data
DELETE FROM allowed_admin_emails;

-- Seed two owners (placeholder emails — replace with real Gmail addresses)
INSERT INTO allowed_admin_emails (email, display_name, role) VALUES
  ('owner.tech@gmail.com', 'Технический владелец', 'owner'),
  ('owner.content@gmail.com', 'Главный администратор', 'owner');

-- Create is_owner() function
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update is_admin() to check any role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = auth.jwt() ->> 'email'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies and recreate with role-based checks
DROP POLICY IF EXISTS "Admins can read allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Admins can insert allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Admins can update allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Admins can delete allowed emails" ON allowed_admin_emails;

CREATE POLICY "Admins can read allowed emails"
  ON allowed_admin_emails FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only owners can insert allowed emails"
  ON allowed_admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (is_owner());

CREATE POLICY "Only owners can update allowed emails"
  ON allowed_admin_emails FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "Only owners can delete allowed emails"
  ON allowed_admin_emails FOR DELETE
  TO authenticated
  USING (is_owner());

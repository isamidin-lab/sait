/*
  # Dynamic Admin Roles System

  ## Purpose
  Replaces the hardcoded owner email system with a fully database-driven
  role management system. Owners can now create, update, and remove admins
  entirely through the UI without code changes.

  ## Changes to `allowed_admin_emails`
  - Adds `role` values 'owner' | 'administrator' | 'moderator'
    (administrator is a new mid-level role)
  - Adds `auth_user_id` column to link to Supabase auth.users for cleanup
  - Preserves existing data

  ## New Column
  - `auth_user_id` (uuid, nullable) — set when the account is created via the UI;
    allows the owner to delete both the profile row and the Auth user at once.

  ## Function Changes
  - `is_owner()` now checks allowed_admin_emails role = 'owner' dynamically
  - `is_admin()` includes all three roles
  - `is_administrator()` checks owner OR administrator

  ## Notes
  - The two hardcoded owner emails are migrated as 'owner' rows here so existing
    accounts continue to work without code changes.
  - auth_user_id is populated lazily when accounts are created through the new UI form.
*/

-- Add auth_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'allowed_admin_emails' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE allowed_admin_emails ADD COLUMN auth_user_id uuid DEFAULT NULL;
  END IF;
END $$;

-- Ensure the role column allows 'administrator' in addition to owner/moderator
DO $$
BEGIN
  -- Drop old check constraint if it exists (it may be named differently)
  ALTER TABLE allowed_admin_emails DROP CONSTRAINT IF EXISTS allowed_admin_emails_role_check;
EXCEPTION WHEN others THEN
  NULL;
END $$;

ALTER TABLE allowed_admin_emails
  ADD CONSTRAINT allowed_admin_emails_role_check
  CHECK (role IN ('owner', 'administrator', 'moderator'));

-- Ensure the two permanent owners exist in the table (idempotent)
INSERT INTO allowed_admin_emails (email, display_name, role)
VALUES
  ('isamidinsabirov@gmail.com', 'Сабиров Исамидин', 'owner'),
  ('zeynulaabidin@gmail.com',   'Зейнуль Абидин',   'owner')
ON CONFLICT (email) DO UPDATE
  SET role = EXCLUDED.role,
      display_name = EXCLUDED.display_name;

-- Recreate helper functions to be purely DB-driven

CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION is_administrator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role IN ('owner', 'administrator')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role IN ('owner', 'administrator', 'moderator')
  );
$$;

-- Update RLS policies on allowed_admin_emails to use new functions

-- Drop old policies
DROP POLICY IF EXISTS "Admins can read allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Owners can insert allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Owners can update allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Owners can delete allowed emails" ON allowed_admin_emails;
DROP POLICY IF EXISTS "Authenticated users can read allowed emails" ON allowed_admin_emails;

-- Fresh policies
CREATE POLICY "Any admin can read team list"
  ON allowed_admin_emails FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Owners can insert team members"
  ON allowed_admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (is_owner());

CREATE POLICY "Owners can update team members"
  ON allowed_admin_emails FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "Owners can delete team members"
  ON allowed_admin_emails FOR DELETE
  TO authenticated
  USING (is_owner());

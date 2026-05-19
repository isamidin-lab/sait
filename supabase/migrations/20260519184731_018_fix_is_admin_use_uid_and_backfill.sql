/*
  # Fix is_admin/is_owner/is_administrator — use auth.uid() + backfill auth_user_id

  ## Root Cause
  auth.jwt() ->> 'email' is not reliably available in all Supabase JWT contexts,
  causing is_admin() to return false for legitimate admins. This blocks all INSERT,
  UPDATE, DELETE operations on answers/questions that use is_admin() in RLS policies.

  ## Fix
  1. Backfill auth_user_id for all existing admin rows where it is NULL, by joining
     against auth.users on email.
  2. Rewrite is_admin(), is_owner(), is_administrator() to use auth.uid() matched
     against auth_user_id — this is always available, never depends on JWT claims.

  ## Safety
  - auth_user_id column already exists (added in migration 016)
  - Backfill is idempotent (only updates WHERE auth_user_id IS NULL)
  - No data loss, no table drops
*/

-- Backfill auth_user_id for all existing rows that are missing it
UPDATE allowed_admin_emails ae
SET auth_user_id = u.id
FROM auth.users u
WHERE ae.email = u.email
  AND ae.auth_user_id IS NULL;

-- Rewrite functions to use auth.uid() directly
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
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
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'administrator')
  );
$$;

-- Add index on auth_user_id for fast RLS evaluation
CREATE INDEX IF NOT EXISTS idx_allowed_admin_emails_auth_user_id
  ON allowed_admin_emails(auth_user_id);

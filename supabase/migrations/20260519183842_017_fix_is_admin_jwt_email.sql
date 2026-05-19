/*
  # Fix is_admin / is_owner / is_administrator — use auth.jwt() instead of auth.users subquery

  ## Problem
  The previous migration rewrote these functions to look up the caller's email via:
    SELECT email FROM auth.users WHERE id = auth.uid()
  
  This subquery is unreliable inside SECURITY DEFINER functions when called from RLS
  policies — it can return NULL in certain execution contexts, causing is_admin() to
  return false for legitimate admins. This silently blocked SELECT on the `answers`
  table for both authenticated admins AND anon users (via nested Supabase joins).

  ## Fix
  Use auth.jwt() ->> 'email' which is always populated from the JWT token and is
  the standard Supabase pattern for RLS email checks.

  ## Affected policies
  All RLS policies that call is_admin(), is_owner(), is_administrator() will
  automatically benefit from this fix — no policy changes needed.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = auth.jwt() ->> 'email'
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
    WHERE email = auth.jwt() ->> 'email'
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
    WHERE email = auth.jwt() ->> 'email'
      AND role IN ('owner', 'administrator')
  );
$$;

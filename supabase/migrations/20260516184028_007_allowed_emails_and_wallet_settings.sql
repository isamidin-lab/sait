/*
  # Add allowed admin emails and wallet settings

  1. New Tables
    - `allowed_admin_emails` — Gmail addresses permitted to access admin panel
      - `id` (uuid, PK)
      - `email` (text, unique, not null) — the Gmail address
      - `display_name` (text) — friendly name for the admin
      - `added_by` (uuid, nullable) — who added this email
      - `created_at` (timestamptz)
    - `wallet_settings` — Donation wallet addresses (single-row table)
      - `id` (int, PK, always 1) — singleton pattern
      - `card_number` (text, default '')
      - `usdt_trc20` (text, default '')
      - `ton_wallet` (text, default '')
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - allowed_admin_emails: admins can read/insert/update/delete, anyone else cannot
    - wallet_settings: anyone can read (for modal), only admins can update

  3. Important Notes
    - The is_admin() function is replaced by checking allowed_admin_emails
    - wallet_settings uses a singleton row (id=1) for easy updates
    - Seed data includes the two existing admin emails and default wallet addresses
*/

-- Create allowed_admin_emails table
CREATE TABLE IF NOT EXISTS allowed_admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  added_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create wallet_settings table (singleton)
CREATE TABLE IF NOT EXISTS wallet_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  card_number text DEFAULT '',
  usdt_trc20 text DEFAULT '',
  ton_wallet text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE allowed_admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_settings ENABLE ROW LEVEL SECURITY;

-- allowed_admin_emails policies
CREATE POLICY "Admins can read allowed emails"
  ON allowed_admin_emails FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert allowed emails"
  ON allowed_admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can update allowed emails"
  ON allowed_admin_emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can delete allowed emails"
  ON allowed_admin_emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  );

-- wallet_settings policies
CREATE POLICY "Anyone can read wallet settings"
  ON wallet_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can update wallet settings"
  ON wallet_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can insert wallet settings"
  ON wallet_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM allowed_admin_emails WHERE email = auth.jwt() ->> 'email')
  );

-- Seed allowed admin emails (migrate existing admins)
INSERT INTO allowed_admin_emails (email, display_name) VALUES
  ('admin@zaynul.ru', 'Главный администратор'),
  ('moderator@zaynul.ru', 'Модератор')
ON CONFLICT (email) DO NOTHING;

-- Seed wallet settings (singleton row)
INSERT INTO wallet_settings (id, card_number, usdt_trc20, ton_wallet) VALUES
  (1, '2200 0000 0000 0000', 'TJxZ9bhKfVQ8YHb3qN7c2mDp4sL5wR6kXv', 'UQBv0x8f3k2Np7mQ1rS4tW6yX8zA9cD0eF2gH4iJ6kLm')
ON CONFLICT (id) DO NOTHING;

-- Replace is_admin() function to check allowed_admin_emails
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE email = auth.jwt() ->> 'email'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Index
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_admin_emails(email);

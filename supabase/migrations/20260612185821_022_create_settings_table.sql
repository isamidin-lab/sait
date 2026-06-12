/*
  Create settings table for site configuration (social links, etc.)
  Key-value store with JSONB values.
*/

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for Footer social links)
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  TO public
  USING (true);

-- Admins can insert/update/delete settings
CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can delete settings"
  ON settings FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM allowed_admin_emails
    WHERE auth_user_id = auth.uid()
  ));

-- Seed empty social links
INSERT INTO settings (key, value) VALUES ('socials', '{}');

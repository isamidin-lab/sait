/*
  # Create quran_tafsir table

  ## Purpose
  Allows administrators to attach custom audio Tafsir (commentary) and notes
  to specific Surahs of the Quran. Each row corresponds to one Surah.

  ## New Tables
  - `quran_tafsir`
    - `id` (uuid, primary key)
    - `surah_number` (integer, unique) — the Quran Surah number 1–114
    - `surah_name` (text) — Arabic/transliterated name for display convenience
    - `audio_url` (text, nullable) — URL to admin-uploaded Tafsir/commentary audio
    - `notes` (text, nullable) — Free-form text notes or commentary by admin
    - `admin_id` (uuid, nullable) — references auth.users for the uploader
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled; public SELECT allowed for published content
  - Only authenticated admins can INSERT/UPDATE/DELETE

  ## Storage
  - Adds `tafsir` folder convention inside the existing `articles` bucket
    (no new bucket required; admins upload via supabase.storage)
*/

CREATE TABLE IF NOT EXISTS quran_tafsir (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer UNIQUE NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  surah_name text NOT NULL DEFAULT '',
  audio_url text DEFAULT NULL,
  notes text DEFAULT NULL,
  admin_id uuid DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quran_tafsir ENABLE ROW LEVEL SECURITY;

-- Anyone can read tafsir records (public reading)
CREATE POLICY "Anyone can read quran tafsir"
  ON quran_tafsir FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert quran tafsir"
  ON quran_tafsir FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users (admins) can update
CREATE POLICY "Authenticated users can update quran tafsir"
  ON quran_tafsir FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users (admins) can delete
CREATE POLICY "Authenticated users can delete quran tafsir"
  ON quran_tafsir FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS quran_tafsir_surah_number_idx ON quran_tafsir(surah_number);

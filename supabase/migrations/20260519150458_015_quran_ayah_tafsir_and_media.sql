/*
  # Quran Ayah-level Tafsir and Media Links

  ## Purpose
  Extends the Quran section to support:
  1. Per-ayah commentary from multiple Islamic scholars
  2. Linking audio lectures and articles to specific Ayahs

  ## New Tables

  ### `quran_ayah_tafsir`
  Stores commentary for a specific Ayah from a specific scholar.
  - `id` (uuid, pk)
  - `surah_number` (integer, 1–114)
  - `ayah_number` (integer, the ayah number within the surah)
  - `scholar_name` (text) — e.g. "Ибн Касир", "Саади", "Шейх Исам"
  - `commentary` (text) — the actual tafsir text
  - `audio_url` (text, nullable) — optional audio for this scholar's commentary on this ayah
  - `admin_id` (uuid, nullable)
  - `created_at`, `updated_at` (timestamptz)

  ### `quran_ayah_media`
  Links articles or external audio to a specific Ayah.
  - `id` (uuid, pk)
  - `surah_number` (integer)
  - `ayah_number` (integer)
  - `media_type` ('article' | 'audio' | 'video')
  - `title` (text)
  - `url` (text) — direct URL or article ID reference
  - `article_id` (uuid, nullable) — FK to articles table if media_type = 'article'
  - `admin_id` (uuid, nullable)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Public SELECT for all
  - Authenticated users (admins) can INSERT/UPDATE/DELETE

  ## Indexes
  - Composite indexes on (surah_number, ayah_number) for fast lookups
*/

-- Ayah-level tafsir from multiple scholars
CREATE TABLE IF NOT EXISTS quran_ayah_tafsir (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  ayah_number integer NOT NULL CHECK (ayah_number >= 1),
  scholar_name text NOT NULL DEFAULT '',
  commentary text NOT NULL DEFAULT '',
  audio_url text DEFAULT NULL,
  admin_id uuid DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quran_ayah_tafsir ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ayah tafsir"
  ON quran_ayah_tafsir FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ayah tafsir"
  ON quran_ayah_tafsir FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ayah tafsir"
  ON quran_ayah_tafsir FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ayah tafsir"
  ON quran_ayah_tafsir FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS quran_ayah_tafsir_lookup_idx
  ON quran_ayah_tafsir(surah_number, ayah_number);

-- Ayah-level media links (articles / audio / video)
CREATE TABLE IF NOT EXISTS quran_ayah_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  ayah_number integer NOT NULL CHECK (ayah_number >= 1),
  media_type text NOT NULL CHECK (media_type IN ('article', 'audio', 'video')),
  title text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  article_id uuid DEFAULT NULL REFERENCES articles(id) ON DELETE SET NULL,
  admin_id uuid DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quran_ayah_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ayah media"
  ON quran_ayah_media FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ayah media"
  ON quran_ayah_media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ayah media"
  ON quran_ayah_media FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ayah media"
  ON quran_ayah_media FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS quran_ayah_media_lookup_idx
  ON quran_ayah_media(surah_number, ayah_number);

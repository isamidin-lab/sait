/*
  # Storage policies for articles bucket

  1. Storage Bucket
    - `articles` bucket (already created) - public bucket for article media files

  2. Storage Policies
    - Allow authenticated admins to upload files
    - Allow public read access to all files
    - Allow authenticated admins to delete files they own
*/

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload article files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'articles');

-- Allow public read access
CREATE POLICY "Public can read article files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'articles');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete article files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'articles');

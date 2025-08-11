-- Storage Bucket RLS Policies for Bank File Uploads
-- This script creates the necessary RLS policies for file upload buckets

-- Enable RLS on storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('rajhi-bank-files', 'rajhi-bank-files', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('ahli-bank-files', 'ahli-bank-files', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('gib-bank-files', 'gib-bank-files', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('alinma-bank-files', 'alinma-bank-files', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('riyad-bank-files', 'riyad-bank-files', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads to rajhi-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to ahli-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to gib-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to alinma-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to riyad-bank-files" ON storage.objects;

DROP POLICY IF EXISTS "Allow anonymous reads from rajhi-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from ahli-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from gib-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from alinma-bank-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from riyad-bank-files" ON storage.objects;

-- Create INSERT policies for anonymous uploads (using anon key)
CREATE POLICY "Allow anonymous uploads to rajhi-bank-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'rajhi-bank-files');

CREATE POLICY "Allow anonymous uploads to ahli-bank-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'ahli-bank-files');

CREATE POLICY "Allow anonymous uploads to gib-bank-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'gib-bank-files');

CREATE POLICY "Allow anonymous uploads to alinma-bank-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'alinma-bank-files');

CREATE POLICY "Allow anonymous uploads to riyad-bank-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'riyad-bank-files');

-- Create SELECT policies for anonymous reads (needed for processing)
CREATE POLICY "Allow anonymous reads from rajhi-bank-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'rajhi-bank-files');

CREATE POLICY "Allow anonymous reads from ahli-bank-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'ahli-bank-files');

CREATE POLICY "Allow anonymous reads from gib-bank-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'gib-bank-files');

CREATE POLICY "Allow anonymous reads from alinma-bank-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'alinma-bank-files');

CREATE POLICY "Allow anonymous reads from riyad-bank-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'riyad-bank-files');

-- Also allow service role full access (for edge functions)
CREATE POLICY "Service role can do anything with rajhi-bank-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'rajhi-bank-files')
WITH CHECK (bucket_id = 'rajhi-bank-files');

CREATE POLICY "Service role can do anything with ahli-bank-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'ahli-bank-files')
WITH CHECK (bucket_id = 'ahli-bank-files');

CREATE POLICY "Service role can do anything with gib-bank-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'gib-bank-files')
WITH CHECK (bucket_id = 'gib-bank-files');

CREATE POLICY "Service role can do anything with alinma-bank-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'alinma-bank-files')
WITH CHECK (bucket_id = 'alinma-bank-files');

CREATE POLICY "Service role can do anything with riyad-bank-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'riyad-bank-files')
WITH CHECK (bucket_id = 'riyad-bank-files');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon;
-- Create and configure storage buckets for bank file uploads
-- Run this in your Supabase SQL Editor

-- First, ensure the storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the buckets table if it doesn't exist (usually exists already)
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Insert or update the storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('rajhi-bank-files', 'rajhi-bank-files', true, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']),
  ('ahli-bank-files', 'ahli-bank-files', true, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']),
  ('gib-bank-files', 'gib-bank-files', true, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']),
  ('alinma-bank-files', 'alinma-bank-files', true, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream']),
  ('riyad-bank-files', 'riyad-bank-files', true, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for these buckets
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%bank-files%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- Create public access policies (simplest approach for development)
CREATE POLICY "Public Access rajhi-bank-files" ON storage.objects
FOR ALL USING (bucket_id = 'rajhi-bank-files');

CREATE POLICY "Public Access ahli-bank-files" ON storage.objects
FOR ALL USING (bucket_id = 'ahli-bank-files');

CREATE POLICY "Public Access gib-bank-files" ON storage.objects
FOR ALL USING (bucket_id = 'gib-bank-files');

CREATE POLICY "Public Access alinma-bank-files" ON storage.objects
FOR ALL USING (bucket_id = 'alinma-bank-files');

CREATE POLICY "Public Access riyad-bank-files" ON storage.objects
FOR ALL USING (bucket_id = 'riyad-bank-files');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Verify buckets were created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id LIKE '%-bank-files';
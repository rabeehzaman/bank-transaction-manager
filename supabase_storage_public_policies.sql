-- Alternative: Make storage buckets public for easier access
-- This is less secure but simpler for development/testing

-- Update buckets to be public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('rajhi-bank-files', 'ahli-bank-files', 'gib-bank-files', 'alinma-bank-files', 'riyad-bank-files');

-- Create simple public access policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING (bucket_id IN ('rajhi-bank-files', 'ahli-bank-files', 'gib-bank-files', 'alinma-bank-files', 'riyad-bank-files'))
WITH CHECK (bucket_id IN ('rajhi-bank-files', 'ahli-bank-files', 'gib-bank-files', 'alinma-bank-files', 'riyad-bank-files'));
# Fix Storage RLS Policy Error

## Problem
You're getting "new row violates row-level security policy" when trying to upload files to Supabase Storage.

## Solution

### Option 1: Apply RLS Policies (Recommended for Production)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `supabase_storage_policies.sql`
4. This will:
   - Create the necessary storage buckets
   - Set up RLS policies for anonymous uploads
   - Allow the service role full access for edge functions

### Option 2: Make Buckets Public (Quick Fix for Development)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `supabase_storage_public_policies.sql`
4. This will make the buckets public (less secure but simpler)

### Option 3: Manual Fix via Dashboard

1. Go to Supabase Dashboard > Storage
2. For each bucket (rajhi-bank-files, ahli-bank-files, etc.):
   - Click on the bucket
   - Go to "Policies" tab
   - Click "New Policy"
   - Select "For full customization"
   - Add these policies:

#### INSERT Policy (for uploads):
```sql
-- Policy name: Allow anonymous uploads
-- Allowed operation: INSERT
-- Target roles: anon
-- WITH CHECK expression:
bucket_id = 'your-bucket-name'
```

#### SELECT Policy (for reads):
```sql
-- Policy name: Allow anonymous reads
-- Allowed operation: SELECT
-- Target roles: anon
-- USING expression:
bucket_id = 'your-bucket-name'
```

## Testing the Fix

After applying the policies:

1. Go to http://localhost:3000/import
2. Select a bank from the dropdown
3. Upload an Excel file
4. The upload should now succeed without RLS errors

## Security Note

The policies above allow anonymous uploads. For production, you should:
- Implement proper authentication
- Restrict uploads to authenticated users only
- Add file validation and virus scanning
- Implement rate limiting
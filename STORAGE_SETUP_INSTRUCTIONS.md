# Storage Bucket Setup Instructions

## Problem
You're getting a 400 Bad Request error when uploading files. This means the storage buckets don't exist or aren't configured properly.

## Quick Fix - Via Supabase Dashboard

### Step 1: Create Storage Buckets

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket** and create each of these buckets:
   - Name: `rajhi-bank-files`
   - Name: `ahli-bank-files`
   - Name: `gib-bank-files`
   - Name: `alinma-bank-files`
   - Name: `riyad-bank-files`

For each bucket:
- **Public bucket**: Toggle ON (for development)
- **File size limit**: 50MB (or 52428800 bytes)
- **Allowed MIME types**: 
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/vnd.ms-excel`
  - `application/octet-stream`

### Step 2: Apply RLS Policies (if buckets are private)

If you want to keep buckets private (more secure), you need to add RLS policies:

1. Go to **Storage** > Click on a bucket > **Policies** tab
2. Click **New Policy** > **For full customization**
3. Create these policies for EACH bucket:

**Policy 1 - Allow Uploads:**
- Policy name: `Allow uploads`
- Allowed operation: `INSERT`
- Target roles: `anon` (or `authenticated` if you have auth)
- WITH CHECK expression: `true`

**Policy 2 - Allow Downloads:**
- Policy name: `Allow downloads`
- Allowed operation: `SELECT`
- Target roles: `anon` (or `authenticated` if you have auth)
- USING expression: `true`

### Step 3: Via SQL Editor (Alternative)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the contents of `fix_storage_buckets.sql`

## Testing

After setup:
1. Go to http://localhost:3000/import
2. Select a bank (e.g., "Rajhi")
3. Upload an Excel file
4. It should upload successfully

## Troubleshooting

If you still get errors:

1. **Check bucket exists**: Go to Storage in Supabase Dashboard
2. **Check file size**: Ensure your Excel file is under 50MB
3. **Check MIME type**: The file should be .xlsx or .xls
4. **Check bucket name**: Ensure the bucket name matches exactly (case-sensitive)
5. **Check RLS policies**: If bucket is private, ensure policies are set

## For Production

For production, you should:
1. Set buckets to private (not public)
2. Use authenticated users only
3. Add proper RLS policies with user-specific access
4. Add virus scanning
5. Implement file validation on the backend
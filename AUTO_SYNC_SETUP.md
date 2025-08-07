# Auto-Sync Setup Guide

This guide explains how to set up automatic department rule application for your transaction management system.

## Overview

The auto-sync feature automatically applies department assignment rules to new transactions as they are inserted into the database using PostgreSQL triggers. This eliminates the need to manually run sync operations.

## Setup Steps

### 1. Apply the Database Migration

You need to apply the migration file that creates the auto-sync infrastructure:

**Option A: Using Supabase CLI (Recommended)**
```bash
cd bank-transaction-manager
supabase db push
```

**Option B: Manual Application**
1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/001_auto_sync_triggers.sql`
3. Run the SQL script

### 2. Verify Migration Success

After applying the migration, verify it was successful:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if the tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('auto_sync_config', 'auto_sync_log');
```

3. Check if the functions were created:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%auto_sync%';
```

### 3. Configure Auto-Sync

1. Go to your admin panel: `/admin/sync`
2. You'll see a new "Automatic Sync Configuration" section
3. Toggle the "Enable Automatic Sync" switch to ON
4. The system will now automatically apply rules to new transactions

## How It Works

### Automatic Processing
- **New Transactions**: Rules are automatically applied when transactions are inserted
- **Updated Transactions**: Rules are applied if a transaction's department is cleared
- **Manual Assignments**: Always preserved - auto-sync never overwrites manual department assignments
- **Batch Processing**: Efficiently handles bulk imports with multiple transaction inserts

### Rule Application Logic
1. Check if auto-sync is enabled
2. Skip transactions that already have departments assigned (except 'Unassigned')
3. Loop through active rules in priority order (highest first)
4. Apply the first matching rule
5. Log the application for audit purposes

### Performance
- **Lightweight**: Each rule test is fast (keyword matching, amount comparison, regex)
- **Scalable**: PostgreSQL triggers handle bulk operations efficiently
- **Safe**: Failed rule applications don't affect transaction insertion
- **Auditable**: All rule applications are logged in `auto_sync_log` table

## Monitoring

### Admin Interface
The admin sync page shows:
- Auto-sync enabled/disabled status
- Statistics: total applications, success rate, failures
- Most frequently used rule
- Last application timestamp

### Database Monitoring
Query the log table for detailed information:
```sql
SELECT 
    transaction_hash,
    rule_name,
    department_name,
    applied_at,
    success
FROM auto_sync_log 
ORDER BY applied_at DESC 
LIMIT 100;
```

## Troubleshooting

### Auto-Sync Not Working
1. **Check if enabled**: Verify auto-sync is turned ON in admin panel
2. **Check migration**: Ensure migration was applied successfully
3. **Check logs**: Look for errors in `auto_sync_log` table
4. **Check rules**: Ensure you have active rules configured

### Performance Issues
1. **Review rule complexity**: Complex regex patterns may slow processing
2. **Monitor rule count**: Too many rules can impact performance
3. **Check bulk imports**: Large imports may take time to process

### Disable Auto-Sync
If you need to disable auto-sync:
1. Use the admin toggle to turn it OFF
2. Or run SQL: `SELECT disable_auto_sync();`

## Database Tables Created

### `auto_sync_config`
Stores the auto-sync enabled/disabled configuration.

### `auto_sync_log`
Audit log of all automatic rule applications with:
- Transaction hash
- Applied rule details
- Success/failure status
- Timestamps
- Error messages (if any)

## Functions Created

- `is_auto_sync_enabled()`: Check if auto-sync is enabled
- `apply_department_rules()`: Main trigger function that applies rules
- `enable_auto_sync()`: Enable auto-sync
- `disable_auto_sync()`: Disable auto-sync
- `get_auto_sync_stats()`: Get statistics for admin dashboard

## Benefits

✅ **Zero-latency processing**: Rules applied immediately as transactions arrive
✅ **Manual assignment protection**: Never overwrites user-assigned departments  
✅ **Bulk-friendly**: Handles large imports efficiently
✅ **Auditable**: Complete log of all automatic applications
✅ **Controllable**: Can be enabled/disabled via admin interface
✅ **Safe**: Errors don't affect transaction insertion success
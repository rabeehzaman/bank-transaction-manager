# Admin Rules Fix Instructions

## Problem
The admin rules page is not working because the required database tables (`departments` and `department_rules`) don't exist in your Supabase database.

## Solution

### Step 1: Run the SQL Migration
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `sql/setup_admin_rules.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL

This will create:
- `departments` table with default categories
- `department_rules` table for automated categorization rules
- `rule_application_logs` table for tracking rule applications
- All necessary indexes and RLS policies

### Step 2: Verify the Tables
After running the SQL, verify the tables were created:
1. Go to the Table Editor in Supabase
2. You should see:
   - `departments` table with 10 default categories
   - `department_rules` table (empty initially)
   - `rule_application_logs` table (empty initially)

### Step 3: Test the Admin Rules Page
1. Navigate to `/admin/rules` in your application
2. You should now be able to:
   - View the empty rules list
   - Click "Add Rule" to create new rules
   - Set up automatic categorization based on:
     - Keywords in transaction descriptions
     - Amount ranges
     - Specific banks
     - Reference patterns (regex)

## Table Structure

### departments
- `id`: UUID primary key
- `name`: Department name (unique)
- `description`: Optional description
- `is_active`: Boolean flag for soft deletes
- `created_at`, `updated_at`: Timestamps

### department_rules
- `id`: UUID primary key
- `department_id`: Foreign key to departments
- `rule_name`: Descriptive name for the rule
- `rule_type`: Type of rule (keyword, amount_range, bank_specific, reference_pattern, date_based)
- `conditions`: JSONB field storing rule conditions
- `priority`: Integer for rule precedence (higher = higher priority)
- `is_active`: Boolean flag to enable/disable rules
- `created_at`, `updated_at`: Timestamps

## Rule Types and Conditions

### Keyword Rules
```json
{
  "keywords": ["grocery", "food", "restaurant"]
}
```

### Amount Range Rules
```json
{
  "min": 0,
  "max": 100
}
```

### Bank Specific Rules
```json
{
  "bank_name": "Ahli"
}
```

### Reference Pattern Rules
```json
{
  "pattern": "^TRF.*"
}
```

## Troubleshooting

If you still see errors after running the SQL:
1. Check that your Supabase environment variables are correctly set in `.env.local`
2. Verify you're authenticated with Supabase
3. Check the browser console for specific error messages
4. Ensure RLS is properly configured for your user role
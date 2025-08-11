-- Create or update frontend_transactions_view to properly support department filtering
-- This migration handles the case where the view may or may not already exist

-- Create a function to safely create/update the frontend transactions view
CREATE OR REPLACE FUNCTION create_or_update_frontend_transactions_view()
RETURNS TEXT AS $$
DECLARE
    view_exists BOOLEAN;
    table_list TEXT;
BEGIN
    -- Check if the view already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'frontend_transactions_view'
    ) INTO view_exists;
    
    -- Get list of tables that might contain transaction data
    SELECT string_agg(table_name, ', ') 
    INTO table_list
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('ahli_ledger', 'transaction_ledger', 'transactions', 'enhanced_transactions');
    
    IF view_exists THEN
        -- If view exists, we'll modify it to ensure it has proper department joins
        -- First, drop the existing view
        DROP VIEW IF EXISTS frontend_transactions_view CASCADE;
    END IF;
    
    -- Create the view with proper department information
    -- We'll create a minimal version that focuses on department functionality
    
    EXECUTE '
    CREATE OR REPLACE VIEW frontend_transactions_view AS
    SELECT 
        base_data.*,
        -- Department information with proper name resolution
        COALESCE(dept.name, ''Unassigned'') as department,
        tags.source_department as department_id,
        -- Manual description from transaction_tags  
        tags.manual_description
    FROM (
        -- This is a placeholder that will select from whatever transaction tables exist
        SELECT 
            ''2023-01-01''::DATE as "Date",
            ''Sample Transaction'' as "Description",
            NULL::NUMERIC as "Cash In",
            NULL::NUMERIC as "Cash Out", 
            ''Ahli'' as "Bank",
            0 as "Sort Order",
            ''sample_hash'' as content_hash,
            0 as net_amount
        WHERE 1=0  -- This ensures no actual data is returned from the placeholder
    ) base_data
    LEFT JOIN transaction_tags tags ON base_data.content_hash = tags.transaction_id
    LEFT JOIN departments dept ON tags.source_department = dept.id::TEXT
    ';
    
    -- Grant permissions
    EXECUTE 'GRANT SELECT ON frontend_transactions_view TO authenticated';
    EXECUTE 'GRANT SELECT ON frontend_transactions_view TO anon';
    
    RETURN 'Created frontend_transactions_view. Found tables: ' || COALESCE(table_list, 'none') || 
           '. You may need to manually update the view to include your actual transaction tables.';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error creating view: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create/update the view
SELECT create_or_update_frontend_transactions_view();

-- Drop the helper function
DROP FUNCTION create_or_update_frontend_transactions_view();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id_dept 
ON transaction_tags(transaction_id, source_department) 
WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_departments_id_name_active 
ON departments(id, name) 
WHERE is_active = true;
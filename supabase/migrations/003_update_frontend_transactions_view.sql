-- Update frontend_transactions_view to include manual_description from transaction_tags
-- This migration safely adds manual_description to the existing view

-- Create a function to safely update the existing view
CREATE OR REPLACE FUNCTION add_manual_description_to_frontend_view()
RETURNS TEXT AS $$
DECLARE
    view_exists BOOLEAN;
    view_definition TEXT;
    updated_definition TEXT;
BEGIN
    -- Check if the view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'frontend_transactions_view'
    ) INTO view_exists;
    
    IF NOT view_exists THEN
        RETURN 'frontend_transactions_view does not exist. Manual creation required.';
    END IF;
    
    -- Get the current view definition
    SELECT pg_get_viewdef('frontend_transactions_view'::regclass, true) INTO view_definition;
    
    -- Check if manual_description is already in the view
    IF view_definition ILIKE '%manual_description%' THEN
        RETURN 'manual_description already exists in frontend_transactions_view';
    END IF;
    
    -- Create the updated view definition by wrapping the original in a subquery
    -- and joining with transaction_tags
    updated_definition := 'CREATE OR REPLACE VIEW frontend_transactions_view AS 
    SELECT 
        base_view.*,
        tt.manual_description
    FROM (' || view_definition || ') base_view
    LEFT JOIN transaction_tags tt ON base_view.content_hash = tt.transaction_id';
    
    -- Execute the updated view definition
    EXECUTE updated_definition;
    
    -- Grant permissions
    EXECUTE 'GRANT SELECT ON frontend_transactions_view TO authenticated';
    EXECUTE 'GRANT SELECT ON frontend_transactions_view TO anon';
    
    RETURN 'Successfully added manual_description to frontend_transactions_view';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error updating view: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update the view
SELECT add_manual_description_to_frontend_view();

-- Drop the helper function after use
DROP FUNCTION IF EXISTS add_manual_description_to_frontend_view();
-- Fix auto-sync triggers to work with correct table structure
-- The original triggers were applied to the wrong tables

-- First, remove the incorrect triggers
DROP TRIGGER IF EXISTS auto_sync_trigger ON enhanced_transactions;
DROP TRIGGER IF EXISTS auto_sync_trigger_tags ON transaction_tags;

-- Update the apply_department_rules function to work with transaction_tags table
-- Since the trigger will be on transaction_tags, we need to look up transaction data
CREATE OR REPLACE FUNCTION apply_department_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule_record RECORD;
    dept_record RECORD;
    keywords TEXT[];
    keyword TEXT;
    search_text TEXT;
    amount_val NUMERIC;
    transaction_date DATE;
    rule_applied BOOLEAN := false;
    transaction_data RECORD;
BEGIN
    -- Only process if auto-sync is enabled
    IF NOT is_auto_sync_enabled() THEN
        RETURN NEW;
    END IF;
    
    -- Only process unassigned transactions (new inserts or updates clearing department)
    IF TG_OP = 'UPDATE' AND OLD.source_department IS NOT NULL AND OLD.source_department != 'Unassigned' AND NEW.source_department IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Skip if department is already assigned (and not being cleared)
    IF NEW.source_department IS NOT NULL AND NEW.source_department != 'Unassigned' THEN
        RETURN NEW;
    END IF;
    
    -- Get transaction data from the frontend_transactions view
    SELECT 
        "Description", "Bank", "Date", net_amount, content_hash
    INTO transaction_data
    FROM frontend_transactions 
    WHERE content_hash = NEW.transaction_id;
    
    -- If we can't find the transaction, skip processing
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Get all active rules ordered by priority (highest first)
    FOR rule_record IN 
        SELECT dr.*, d.name as dept_name, d.id as dept_id
        FROM department_rules dr
        JOIN departments d ON dr.department_id = d.id
        WHERE dr.is_active = true
        ORDER BY dr.priority DESC
    LOOP
        -- Apply rule based on type
        CASE rule_record.rule_type
            WHEN 'keyword' THEN
                keywords := ARRAY(SELECT jsonb_array_elements_text(rule_record.conditions->'keywords'));
                search_text := LOWER(COALESCE(transaction_data."Description", ''));
                
                -- Check if any keyword matches
                FOREACH keyword IN ARRAY keywords
                LOOP
                    IF search_text LIKE '%' || LOWER(keyword) || '%' THEN
                        rule_applied := true;
                        EXIT;
                    END IF;
                END LOOP;
                
            WHEN 'amount_range' THEN
                amount_val := ABS(transaction_data.net_amount);
                IF amount_val >= (rule_record.conditions->>'min')::NUMERIC 
                   AND amount_val <= (rule_record.conditions->>'max')::NUMERIC THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'bank_specific' THEN
                IF transaction_data."Bank" = rule_record.conditions->>'bank_name' THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'reference_pattern' THEN
                IF transaction_data."Description" ~ (rule_record.conditions->>'pattern') THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'date_based' THEN
                transaction_date := transaction_data."Date"::DATE;
                
                -- Check date range
                IF rule_record.conditions ? 'start_date' AND 
                   transaction_date < (rule_record.conditions->>'start_date')::DATE THEN
                    rule_applied := false;
                ELSIF rule_record.conditions ? 'end_date' AND 
                      transaction_date > (rule_record.conditions->>'end_date')::DATE THEN
                    rule_applied := false;
                ELSIF rule_record.conditions ? 'days_of_week' THEN
                    -- Check if day of week matches (0=Sunday, 6=Saturday)
                    IF NOT (EXTRACT(DOW FROM transaction_date)::INTEGER = ANY(
                        ARRAY(SELECT jsonb_array_elements_text(rule_record.conditions->'days_of_week'))::INTEGER[]
                    )) THEN
                        rule_applied := false;
                    ELSE
                        rule_applied := true;
                    END IF;
                ELSE
                    rule_applied := true;
                END IF;
        END CASE;
        
        -- If rule matched, apply it and exit
        IF rule_applied THEN
            -- Find department name by ID (we have the UUID, need the name)
            SELECT name INTO NEW.source_department FROM departments WHERE id = rule_record.department_id;
            
            -- Log the successful rule application
            INSERT INTO auto_sync_log (
                transaction_hash, 
                rule_id, 
                rule_name, 
                department_id, 
                department_name,
                success
            ) VALUES (
                NEW.transaction_id,
                rule_record.id,
                rule_record.rule_name,
                rule_record.department_id,
                rule_record.dept_name,
                true
            );
            
            EXIT; -- Only apply first matching rule
        END IF;
        
        rule_applied := false; -- Reset for next rule
    END LOOP;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        INSERT INTO auto_sync_log (
            transaction_hash, 
            success, 
            error_message
        ) VALUES (
            NEW.transaction_id,
            false,
            SQLERRM
        );
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on transaction_tags table (which is where departments are actually stored)
CREATE TRIGGER auto_sync_trigger_tags 
    BEFORE INSERT OR UPDATE ON transaction_tags
    FOR EACH ROW
    EXECUTE FUNCTION apply_department_rules();

-- Clean up old failed logs from the broken trigger
-- Keep only the last 1000 entries to avoid losing all history
DELETE FROM auto_sync_log 
WHERE success = false 
AND id NOT IN (
    SELECT id 
    FROM auto_sync_log 
    WHERE success = false 
    ORDER BY applied_at DESC 
    LIMIT 1000
);
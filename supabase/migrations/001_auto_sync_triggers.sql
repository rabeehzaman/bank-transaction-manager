-- Auto-sync triggers for applying department rules automatically
-- This migration creates the infrastructure for automatic rule application

-- Create auto-sync configuration table
CREATE TABLE IF NOT EXISTS auto_sync_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by TEXT
);

-- Insert default configuration
INSERT INTO auto_sync_config (enabled) VALUES (false)
ON CONFLICT DO NOTHING;

-- Create auto-sync log table for audit purposes
CREATE TABLE IF NOT EXISTS auto_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash TEXT NOT NULL,
    rule_id UUID,
    rule_name TEXT,
    department_id UUID,
    department_name TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Create function to check if auto-sync is enabled
CREATE OR REPLACE FUNCTION is_auto_sync_enabled()
RETURNS BOOLEAN AS $$
DECLARE
    sync_enabled BOOLEAN;
BEGIN
    SELECT enabled INTO sync_enabled
    FROM auto_sync_config
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(sync_enabled, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to apply department rules to a transaction
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
BEGIN
    -- Only process if auto-sync is enabled
    IF NOT is_auto_sync_enabled() THEN
        RETURN NEW;
    END IF;
    
    -- Only process unassigned transactions
    IF NEW.department IS NOT NULL AND NEW.department != 'Unassigned' THEN
        RETURN NEW;
    END IF;
    
    -- Get all active rules ordered by priority (highest first)
    FOR rule_record IN 
        SELECT dr.*, d.name as dept_name 
        FROM department_rules dr
        JOIN departments d ON dr.department_id = d.id
        WHERE dr.is_active = true
        ORDER BY dr.priority DESC
    LOOP
        -- Apply rule based on type
        CASE rule_record.rule_type
            WHEN 'keyword' THEN
                keywords := ARRAY(SELECT jsonb_array_elements_text(rule_record.conditions->'keywords'));
                search_text := LOWER(COALESCE(NEW."Description", ''));
                
                -- Check if any keyword matches
                FOREACH keyword IN ARRAY keywords
                LOOP
                    IF search_text LIKE '%' || LOWER(keyword) || '%' THEN
                        rule_applied := true;
                        EXIT;
                    END IF;
                END LOOP;
                
            WHEN 'amount_range' THEN
                amount_val := ABS(NEW.net_amount);
                IF amount_val >= (rule_record.conditions->>'min')::NUMERIC 
                   AND amount_val <= (rule_record.conditions->>'max')::NUMERIC THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'bank_specific' THEN
                IF NEW."Bank" = rule_record.conditions->>'bank_name' THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'reference_pattern' THEN
                IF NEW."Description" ~ (rule_record.conditions->>'pattern') THEN
                    rule_applied := true;
                END IF;
                
            WHEN 'date_based' THEN
                transaction_date := NEW."Date"::DATE;
                
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
            NEW.department := rule_record.dept_name;
            NEW.department_id := rule_record.department_id;
            
            -- Log the rule application
            INSERT INTO auto_sync_log (
                transaction_hash, 
                rule_id, 
                rule_name, 
                department_id, 
                department_name,
                success
            ) VALUES (
                NEW.content_hash,
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
            NEW.content_hash,
            false,
            SQLERRM
        );
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic rule application
-- We'll create triggers on the main transaction tables

-- First, let's check what transaction tables exist
-- This will need to be adjusted based on your actual table structure

-- Assuming the main transaction table is called 'enhanced_transactions' or similar
-- Create trigger on the main transaction view/table
DO $$
BEGIN
    -- Try to create trigger on enhanced_transactions if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_transactions') THEN
        DROP TRIGGER IF EXISTS auto_sync_trigger ON enhanced_transactions;
        CREATE TRIGGER auto_sync_trigger
            BEFORE INSERT OR UPDATE ON enhanced_transactions
            FOR EACH ROW
            EXECUTE FUNCTION apply_department_rules();
    END IF;
    
    -- Try to create trigger on transaction_tags if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_tags') THEN
        DROP TRIGGER IF EXISTS auto_sync_trigger_tags ON transaction_tags;
        CREATE TRIGGER auto_sync_trigger_tags
            BEFORE INSERT OR UPDATE ON transaction_tags
            FOR EACH ROW
            EXECUTE FUNCTION apply_department_rules();
    END IF;
END $$;

-- Create helper functions for admin interface
CREATE OR REPLACE FUNCTION enable_auto_sync()
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE auto_sync_config 
    SET enabled = true, updated_at = NOW()
    WHERE id = (SELECT id FROM auto_sync_config ORDER BY created_at DESC LIMIT 1);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION disable_auto_sync()
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE auto_sync_config 
    SET enabled = false, updated_at = NOW()
    WHERE id = (SELECT id FROM auto_sync_config ORDER BY created_at DESC LIMIT 1);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get auto-sync statistics
CREATE OR REPLACE FUNCTION get_auto_sync_stats()
RETURNS TABLE (
    total_applications BIGINT,
    successful_applications BIGINT,
    failed_applications BIGINT,
    last_application TIMESTAMP,
    most_used_rule TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE success = true) as successful_applications,
        COUNT(*) FILTER (WHERE success = false) as failed_applications,
        MAX(applied_at) as last_application,
        (
            SELECT rule_name 
            FROM auto_sync_log 
            WHERE success = true AND rule_name IS NOT NULL
            GROUP BY rule_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_used_rule
    FROM auto_sync_log;
END;
$$ LANGUAGE plpgsql;
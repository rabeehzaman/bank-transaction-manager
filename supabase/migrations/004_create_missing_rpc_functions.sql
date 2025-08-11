-- Create missing RPC functions for department assignment
-- These functions are called by the frontend but were not previously defined

-- First, let's create a function to generate content_hash (if not exists)
CREATE OR REPLACE FUNCTION generate_content_hash(
    p_bank_name TEXT,
    p_transaction_date TEXT, 
    p_description TEXT,
    p_amount NUMERIC
)
RETURNS TEXT AS $$
BEGIN
    -- Generate a consistent hash based on transaction data
    -- This should match how content_hash is generated in the application
    RETURN encode(
        sha256(
            (p_bank_name || '_' || p_transaction_date || '_' || p_description || '_' || p_amount::TEXT)::bytea
        ), 
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Create assign_department_to_transaction RPC function
CREATE OR REPLACE FUNCTION assign_department_to_transaction(
    p_bank_name TEXT,
    p_transaction_date TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_department_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT 'user'
)
RETURNS VOID AS $$
DECLARE
    content_hash_value TEXT;
    existing_tag_id UUID;
    department_name TEXT;
BEGIN
    -- Generate content hash for this transaction
    content_hash_value := generate_content_hash(p_bank_name, p_transaction_date, p_description, p_amount);
    
    -- Get department name from ID
    SELECT name INTO department_name
    FROM departments
    WHERE id = p_department_id AND is_active = true;
    
    IF department_name IS NULL THEN
        RAISE EXCEPTION 'Department with ID % not found or inactive', p_department_id;
    END IF;
    
    -- Check if a transaction_tag record already exists
    SELECT id INTO existing_tag_id
    FROM transaction_tags
    WHERE transaction_id = content_hash_value;

    IF existing_tag_id IS NOT NULL THEN
        -- Update existing record
        UPDATE transaction_tags
        SET 
            source_department = p_department_id::TEXT,
            notes = COALESCE(p_notes, notes),
            updated_at = NOW()
        WHERE id = existing_tag_id;
    ELSE
        -- Create new record
        INSERT INTO transaction_tags (
            transaction_id,
            source_department,
            notes,
            created_at,
            updated_at
        ) VALUES (
            content_hash_value,
            p_department_id::TEXT,
            p_notes,
            NOW(),
            NOW()
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error assigning department to transaction: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create remove_department_assignment RPC function
CREATE OR REPLACE FUNCTION remove_department_assignment(
    p_content_hash TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Remove department assignment but keep the record if it has other data
    UPDATE transaction_tags
    SET 
        source_department = NULL,
        updated_at = NOW()
    WHERE transaction_id = p_content_hash;
    
    -- Clean up record if it has no useful data left
    DELETE FROM transaction_tags
    WHERE transaction_id = p_content_hash
    AND source_department IS NULL
    AND (tags IS NULL OR array_length(tags, 1) IS NULL)
    AND (notes IS NULL OR TRIM(notes) = '')
    AND (manual_description IS NULL OR TRIM(manual_description) = '');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error removing department assignment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create bulk_assign_department RPC function
CREATE OR REPLACE FUNCTION bulk_assign_department(
    p_content_hashes TEXT[],
    p_department_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT 'user'
)
RETURNS INTEGER AS $$
DECLARE
    content_hash TEXT;
    existing_tag_id UUID;
    department_name TEXT;
    affected_count INTEGER := 0;
BEGIN
    -- Get department name from ID
    SELECT name INTO department_name
    FROM departments
    WHERE id = p_department_id AND is_active = true;
    
    IF department_name IS NULL THEN
        RAISE EXCEPTION 'Department with ID % not found or inactive', p_department_id;
    END IF;
    
    -- Process each content hash
    FOREACH content_hash IN ARRAY p_content_hashes
    LOOP
        -- Check if a transaction_tag record already exists
        SELECT id INTO existing_tag_id
        FROM transaction_tags
        WHERE transaction_id = content_hash;

        IF existing_tag_id IS NOT NULL THEN
            -- Update existing record
            UPDATE transaction_tags
            SET 
                source_department = p_department_id::TEXT,
                notes = COALESCE(p_notes, notes),
                updated_at = NOW()
            WHERE id = existing_tag_id;
        ELSE
            -- Create new record
            INSERT INTO transaction_tags (
                transaction_id,
                source_department,
                notes,
                created_at,
                updated_at
            ) VALUES (
                content_hash,
                p_department_id::TEXT,
                p_notes,
                NOW(),
                NOW()
            );
        END IF;
        
        affected_count := affected_count + 1;
    END LOOP;
    
    RETURN affected_count;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error bulk assigning departments: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION assign_department_to_transaction(TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_department_to_transaction(TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION remove_department_assignment(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_department_assignment(TEXT) TO anon;

GRANT EXECUTE ON FUNCTION bulk_assign_department(TEXT[], UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_assign_department(TEXT[], UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION generate_content_hash(TEXT, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_content_hash(TEXT, TEXT, TEXT, NUMERIC) TO anon;
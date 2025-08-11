-- Add manual_description column to transaction_tags table for persistent storage
-- This ensures manual descriptions survive data re-uploads like department assignments do

-- Add manual_description column to transaction_tags
ALTER TABLE public.transaction_tags 
ADD COLUMN IF NOT EXISTS manual_description TEXT;

-- Add index for performance when querying by manual_description
CREATE INDEX IF NOT EXISTS idx_transaction_tags_manual_description ON public.transaction_tags(manual_description) WHERE manual_description IS NOT NULL;

-- Update the update_manual_description RPC function to work with transaction_tags table
CREATE OR REPLACE FUNCTION update_manual_description(
    p_content_hash TEXT,
    p_manual_description TEXT
)
RETURNS VOID AS $$
DECLARE
    existing_tag_id UUID;
BEGIN
    -- Check if a transaction_tag record already exists for this content_hash
    SELECT id INTO existing_tag_id
    FROM transaction_tags
    WHERE transaction_id = p_content_hash;

    IF existing_tag_id IS NOT NULL THEN
        -- Update existing record
        UPDATE transaction_tags
        SET 
            manual_description = p_manual_description,
            updated_at = NOW()
        WHERE id = existing_tag_id;
    ELSE
        -- Create new record if none exists
        INSERT INTO transaction_tags (
            transaction_id,
            manual_description,
            created_at,
            updated_at
        ) VALUES (
            p_content_hash,
            p_manual_description,
            NOW(),
            NOW()
        );
    END IF;

    -- If manual_description is null or empty, we could optionally clean up the record
    -- if it has no other data (department, tags, notes)
    IF p_manual_description IS NULL OR TRIM(p_manual_description) = '' THEN
        DELETE FROM transaction_tags
        WHERE transaction_id = p_content_hash
        AND source_department IS NULL
        AND (tags IS NULL OR array_length(tags, 1) IS NULL)
        AND (notes IS NULL OR TRIM(notes) = '');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE EXCEPTION 'Error updating manual description for transaction %: %', p_content_hash, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_manual_description(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_manual_description(TEXT, TEXT) TO anon;
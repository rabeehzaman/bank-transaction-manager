-- Create transaction_tags table for storing department assignments and other metadata
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT NOT NULL UNIQUE,
    source_department TEXT,
    tags TEXT[], -- Array of additional tags
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_department ON public.transaction_tags(source_department);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_created_at ON public.transaction_tags(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transaction_tags_updated_at 
    BEFORE UPDATE ON public.transaction_tags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.transaction_tags TO authenticated;
GRANT ALL ON public.transaction_tags TO anon;
-- Create linked_transfers table for storing transfer group associations
CREATE TABLE IF NOT EXISTS public.linked_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id_1 TEXT NOT NULL,
    transaction_id_2 TEXT NOT NULL,
    source_department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linked_transfers_transaction_id_1 ON public.linked_transfers(transaction_id_1);
CREATE INDEX IF NOT EXISTS idx_linked_transfers_transaction_id_2 ON public.linked_transfers(transaction_id_2);
CREATE INDEX IF NOT EXISTS idx_linked_transfers_created_at ON public.linked_transfers(created_at);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_linked_transfers_updated_at 
    BEFORE UPDATE ON public.linked_transfers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE public.linked_transfers ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment if you want to add authentication later)
-- CREATE POLICY "Users can view their own transfers" ON public.linked_transfers
--     FOR SELECT USING (auth.uid()::text = created_by);

-- Create a view to easily get linked transaction pairs with their details
CREATE OR REPLACE VIEW public.transfer_pairs AS
SELECT 
    lt.id as transfer_group_id,
    lt.source_department,
    lt.created_at,
    lt.created_by,
    lt.transaction_id_1,
    lt.transaction_id_2
FROM public.linked_transfers lt;

-- Grant permissions (adjust as needed for your security model)
GRANT ALL ON public.linked_transfers TO authenticated;
GRANT ALL ON public.transfer_pairs TO authenticated;
GRANT ALL ON public.linked_transfers TO anon;
GRANT ALL ON public.transfer_pairs TO anon;
-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read departments
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments"
    ON departments
    FOR SELECT
    TO authenticated
    USING (is_active = true OR auth.uid() = created_by);

-- Allow authenticated users to insert departments
DROP POLICY IF EXISTS "Allow authenticated users to insert departments" ON departments;
CREATE POLICY "Allow authenticated users to insert departments"
    ON departments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update departments
DROP POLICY IF EXISTS "Allow authenticated users to update departments" ON departments;
CREATE POLICY "Allow authenticated users to update departments"
    ON departments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to soft delete departments
DROP POLICY IF EXISTS "Allow authenticated users to soft delete departments" ON departments;
CREATE POLICY "Allow authenticated users to soft delete departments"
    ON departments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (is_active = false);

-- Insert default departments if they don't exist
INSERT INTO departments (name, description, is_active)
VALUES 
    ('Food', 'Food and groceries expenses', true),
    ('Transportation', 'Transportation and travel expenses', true),
    ('Entertainment', 'Entertainment and leisure expenses', true),
    ('Healthcare', 'Medical and healthcare expenses', true),
    ('Shopping', 'General shopping and retail purchases', true),
    ('Bills & Utilities', 'Recurring bills and utility payments', true),
    ('Education', 'Education and learning expenses', true),
    ('Income', 'Income and earnings', true),
    ('Investment', 'Investment transactions', true),
    ('Other', 'Other miscellaneous transactions', true)
ON CONFLICT (name) DO NOTHING;
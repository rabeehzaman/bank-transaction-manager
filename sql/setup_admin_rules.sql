-- Combined SQL to set up departments and department_rules tables
-- Run this in your Supabase SQL Editor

-- 1. First create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Create updated_at trigger for departments
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

-- Enable RLS for departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments"
    ON departments
    FOR SELECT
    TO authenticated
    USING (is_active = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow authenticated users to insert departments" ON departments;
CREATE POLICY "Allow authenticated users to insert departments"
    ON departments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update departments" ON departments;
CREATE POLICY "Allow authenticated users to update departments"
    ON departments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to soft delete departments" ON departments;
CREATE POLICY "Allow authenticated users to soft delete departments"
    ON departments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (is_active = false);

-- Insert default departments
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

-- 2. Create department_rules table
CREATE TABLE IF NOT EXISTS department_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('keyword', 'amount_range', 'bank_specific', 'reference_pattern', 'date_based')),
    conditions JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for department_rules
CREATE INDEX IF NOT EXISTS idx_department_rules_department_id ON department_rules(department_id);
CREATE INDEX IF NOT EXISTS idx_department_rules_priority ON department_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_department_rules_is_active ON department_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_department_rules_rule_type ON department_rules(rule_type);

-- Create updated_at trigger for department_rules
CREATE OR REPLACE FUNCTION update_department_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_department_rules_updated_at ON department_rules;
CREATE TRIGGER update_department_rules_updated_at
    BEFORE UPDATE ON department_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_department_rules_updated_at();

-- Enable RLS for department_rules
ALTER TABLE department_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for department_rules
DROP POLICY IF EXISTS "Allow authenticated users to read department rules" ON department_rules;
CREATE POLICY "Allow authenticated users to read department rules"
    ON department_rules
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert department rules" ON department_rules;
CREATE POLICY "Allow authenticated users to insert department rules"
    ON department_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update department rules" ON department_rules;
CREATE POLICY "Allow authenticated users to update department rules"
    ON department_rules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete department rules" ON department_rules;
CREATE POLICY "Allow authenticated users to delete department rules"
    ON department_rules
    FOR DELETE
    TO authenticated
    USING (true);

-- 3. Create rule application log table
CREATE TABLE IF NOT EXISTS rule_application_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES department_rules(id) ON DELETE SET NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rule application logs
CREATE INDEX IF NOT EXISTS idx_rule_application_logs_rule_id ON rule_application_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_application_logs_status ON rule_application_logs(status);
CREATE INDEX IF NOT EXISTS idx_rule_application_logs_created_at ON rule_application_logs(created_at DESC);

-- Enable RLS for rule application logs
ALTER TABLE rule_application_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rule application logs
DROP POLICY IF EXISTS "Allow authenticated users to read rule application logs" ON rule_application_logs;
CREATE POLICY "Allow authenticated users to read rule application logs"
    ON rule_application_logs
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert rule application logs" ON rule_application_logs;
CREATE POLICY "Allow authenticated users to insert rule application logs"
    ON rule_application_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Optional: Create sample rules for common categories
-- Uncomment the following to add example rules:

/*
-- Food category rules
INSERT INTO department_rules (department_id, rule_name, rule_type, conditions, priority)
SELECT 
    id,
    'Food & Grocery Keywords',
    'keyword',
    jsonb_build_object('keywords', ARRAY['grocery', 'supermarket', 'restaurant', 'cafe', 'food', 'pizza', 'burger']),
    150
FROM departments
WHERE name = 'Food'
ON CONFLICT DO NOTHING;

-- Transportation rules
INSERT INTO department_rules (department_id, rule_name, rule_type, conditions, priority)
SELECT 
    id,
    'Transportation Keywords',
    'keyword',
    jsonb_build_object('keywords', ARRAY['uber', 'taxi', 'gas', 'fuel', 'parking', 'transit']),
    150
FROM departments
WHERE name = 'Transportation'
ON CONFLICT DO NOTHING;

-- Bills & Utilities rules
INSERT INTO department_rules (department_id, rule_name, rule_type, conditions, priority)
SELECT 
    id,
    'Utility Companies',
    'keyword',
    jsonb_build_object('keywords', ARRAY['electric', 'water', 'gas', 'internet', 'phone', 'mobile']),
    150
FROM departments
WHERE name = 'Bills & Utilities'
ON CONFLICT DO NOTHING;
*/
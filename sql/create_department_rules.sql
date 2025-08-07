-- Create department_rules table for automated transaction categorization
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

-- Create indexes for better query performance
CREATE INDEX idx_department_rules_department_id ON department_rules(department_id);
CREATE INDEX idx_department_rules_priority ON department_rules(priority DESC);
CREATE INDEX idx_department_rules_is_active ON department_rules(is_active);
CREATE INDEX idx_department_rules_rule_type ON department_rules(rule_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_department_rules_updated_at
    BEFORE UPDATE ON department_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE department_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read rules
CREATE POLICY "Allow authenticated users to read department rules"
    ON department_rules
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert rules
CREATE POLICY "Allow authenticated users to insert department rules"
    ON department_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update their own rules or any rule if they're admin
CREATE POLICY "Allow authenticated users to update department rules"
    ON department_rules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete their own rules or any rule if they're admin
CREATE POLICY "Allow authenticated users to delete department rules"
    ON department_rules
    FOR DELETE
    TO authenticated
    USING (true);

-- Create rule application log table
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
CREATE INDEX idx_rule_application_logs_rule_id ON rule_application_logs(rule_id);
CREATE INDEX idx_rule_application_logs_status ON rule_application_logs(status);
CREATE INDEX idx_rule_application_logs_created_at ON rule_application_logs(created_at DESC);

-- Enable RLS for rule application logs
ALTER TABLE rule_application_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rule application logs
CREATE POLICY "Allow authenticated users to read rule application logs"
    ON rule_application_logs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert rule application logs"
    ON rule_application_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Sample rules for testing (optional - remove in production)
-- INSERT INTO department_rules (department_id, rule_name, rule_type, conditions, priority)
-- SELECT 
--     id,
--     'Auto-categorize ' || name || ' transactions',
--     'keyword',
--     jsonb_build_object('keywords', ARRAY[lower(name)]),
--     100
-- FROM departments
-- WHERE name IN ('Food', 'Transportation', 'Entertainment')
-- ON CONFLICT DO NOTHING;
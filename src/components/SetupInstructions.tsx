'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, Copy, ExternalLink, Database, Key } from 'lucide-react'

export default function SetupInstructions() {
  const [copiedSQL, setCopiedSQL] = useState(false)

  const sqlScript = `-- Create transaction_tags table for department assignments
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT NOT NULL UNIQUE,
    source_department TEXT,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);

-- Grant permissions
GRANT ALL ON public.transaction_tags TO authenticated;
GRANT ALL ON public.transaction_tags TO anon;`

  const copySQL = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopiedSQL(true)
    setTimeout(() => setCopiedSQL(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Update your Supabase credentials and create the required database tables.
            </AlertDescription>
          </Alert>

          {/* Step 1: Get Supabase Credentials */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              Get Your Supabase Credentials
            </h3>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                <li>Navigate to your project: <code className="bg-muted px-2 py-1 rounded">gnwfsddjfhtrczoozpfd</code></li>
                <li>Click <strong>Settings</strong> in the left sidebar</li>
                <li>Click <strong>API</strong> in the settings menu</li>
                <li>Copy the <strong>anon public</strong> key (not the service role key)</li>
                <li>Update your <code className="bg-muted px-2 py-1 rounded">.env.local</code> file with the correct anon key</li>
              </ol>
            </div>
          </div>

          {/* Step 2: Create Database Tables */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              Create Required Database Tables
            </h3>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Run this SQL script in your Supabase SQL Editor:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{sqlScript}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copySQL}
                  className="absolute top-2 right-2"
                >
                  {copiedSQL ? 'Copied!' : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Code className="w-4 h-4" />
                <span>Go to Supabase Dashboard → SQL Editor → New Query → Paste and Run</span>
              </div>
            </div>
          </div>

          {/* Step 3: Verify Setup */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              Verify Your Setup
            </h3>
            <div className="space-y-2">
              <p className="text-muted-foreground">After updating credentials and running the SQL:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Refresh this page</li>
                <li>Check that you can see your transaction data</li>
                <li>Try linking a few transactions to test the functionality</li>
                <li>Assign departments to transactions</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Make sure your <code>ahli_ledger</code> and <code>transaction_ledger</code> tables exist in your Supabase database. 
              The app will combine data from both tables to provide a unified view.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
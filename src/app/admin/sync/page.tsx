'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Zap, Play, RotateCcw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { ruleService, DepartmentRule } from '@/lib/supabase-admin'
import { transactionService } from '@/lib/supabase'

interface SyncProgress {
  total: number
  processed: number
  current_rule?: string
  status: 'idle' | 'running' | 'completed' | 'error'
  error?: string
}

export default function AdminSyncPage() {
  const [rules, setRules] = useState<DepartmentRule[]>([])
  const [loading, setLoading] = useState(true)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    processed: 0,
    status: 'idle'
  })
  const [lastSyncResults, setLastSyncResults] = useState<{
    total_processed: number
    rules_applied: number
    timestamp: string
  } | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const rulesData = await ruleService.getAllRules()
      setRules(rulesData.filter(r => r.is_active))
    } catch {
      toast.error('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  const applyRulesToTransactions = async () => {
    if (rules.length === 0) {
      toast.error('No active rules found')
      return
    }

    setSyncProgress({
      total: 0,
      processed: 0,
      status: 'running'
    })

    try {
      // Get all transactions
      const transactions = await transactionService.getAllTransactionsWithMetadata()
      
      setSyncProgress(prev => ({
        ...prev,
        total: transactions.length
      }))

      let processed = 0
      let rulesApplied = 0

      // Process transactions in batches for better performance
      const batchSize = 50
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (transaction) => {
          // Skip transactions that already have a manually assigned department
          if (transaction.source_department) {
            return
          }

          // Apply rules in priority order
          for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
            setSyncProgress(prev => ({
              ...prev,
              current_rule: rule.rule_name
            }))

            const matches = await ruleService.testRule(rule, transaction as unknown as Record<string, unknown>)
            if (matches) {
              const department = rule.department?.name
              if (department) {
                await transactionService.updateTransactionDepartment(transaction.id, department)
                rulesApplied++
                break // Only apply the first matching rule
              }
            }
          }
        }))

        processed += batch.length
        setSyncProgress(prev => ({
          ...prev,
          processed
        }))

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setSyncProgress({
        total: transactions.length,
        processed: transactions.length,
        status: 'completed'
      })

      setLastSyncResults({
        total_processed: transactions.length,
        rules_applied: rulesApplied,
        timestamp: new Date().toISOString()
      })

      toast.success(`Sync completed! Applied rules to ${rulesApplied} transactions.`)

    } catch (error: unknown) {
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Sync failed: ' + errorMessage)
    }
  }

  const resetSync = () => {
    setSyncProgress({
      total: 0,
      processed: 0,
      status: 'idle'
    })
  }

  const getProgressPercentage = () => {
    if (syncProgress.total === 0) return 0
    return (syncProgress.processed / syncProgress.total) * 100
  }

  const getStatusIcon = () => {
    switch (syncProgress.status) {
      case 'running':
        return <Clock className="w-4 h-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">Loading sync data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Rule Synchronization
              </CardTitle>
              <CardDescription>
                Apply department assignment rules to all transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {syncProgress.status === 'running' && (
                <Button variant="outline" onClick={resetSync}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button 
                onClick={applyRulesToTransactions}
                disabled={syncProgress.status === 'running' || rules.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Rules Summary */}
          <div>
            <h3 className="font-medium mb-3">Active Rules ({rules.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{rule.rule_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rule.department?.name} • Priority {rule.priority}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rule.rule_type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Progress */}
          {syncProgress.status !== 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">
                  {syncProgress.status === 'running' && 'Syncing transactions...'}
                  {syncProgress.status === 'completed' && 'Sync completed successfully'}
                  {syncProgress.status === 'error' && 'Sync failed'}
                </span>
              </div>

              {syncProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {syncProgress.processed} of {syncProgress.total} transactions processed
                    </span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  
                  {syncProgress.current_rule && syncProgress.status === 'running' && (
                    <div className="text-sm text-muted-foreground">
                      Applying rule: {syncProgress.current_rule}
                    </div>
                  )}
                </div>
              )}

              {syncProgress.status === 'error' && syncProgress.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{syncProgress.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Last Sync Results */}
          {lastSyncResults && syncProgress.status !== 'running' && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Last Sync Results</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {lastSyncResults.total_processed}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Transactions Processed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {lastSyncResults.rules_applied}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rules Applied
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {new Date(lastSyncResults.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Sync Time
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This sync will only apply rules to transactions that don&apos;t already have a department assigned. 
              Manually assigned departments will be preserved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
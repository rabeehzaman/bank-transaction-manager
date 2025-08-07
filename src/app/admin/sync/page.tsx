'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Zap, Play, RotateCcw, CheckCircle, AlertCircle, Clock, Settings, Activity } from 'lucide-react'
import { ruleService, DepartmentRule, autoSyncService, AutoSyncConfig, AutoSyncStats } from '@/lib/supabase-admin'
import { transactionService, departmentService, Department } from '@/lib/supabase'
import ErrorBoundary from '@/components/ErrorBoundary'

interface SyncProgress {
  total: number
  processed: number
  current_rule?: string
  status: 'idle' | 'running' | 'completed' | 'error'
  error?: string
}

export default function AdminSyncPage() {
  const [rules, setRules] = useState<DepartmentRule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
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
  const [autoSyncConfig, setAutoSyncConfig] = useState<AutoSyncConfig | null>(null)
  const [autoSyncStats, setAutoSyncStats] = useState<AutoSyncStats | null>(null)
  const [autoSyncLoading, setAutoSyncLoading] = useState(false)
  const [migrationApplied, setMigrationApplied] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [rulesData, departmentsData] = await Promise.all([
        ruleService.getAllRules(),
        departmentService.getAllDepartments()
      ])
      setRules(rulesData.filter(r => r.is_active))
      setDepartments(departmentsData)

      // Load auto-sync data separately with error handling
      try {
        const [autoConfig, autoStats] = await Promise.all([
          autoSyncService.getConfig(),
          autoSyncService.getStats()
        ])
        setAutoSyncConfig(autoConfig)
        setAutoSyncStats(autoStats)
      } catch {
        console.log('Auto-sync features not available - migration may not be applied yet')
        // Set default values so UI doesn't break
        setAutoSyncConfig(null)
        setAutoSyncStats(null)
        setMigrationApplied(false)
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (!migrationApplied) {
      toast.error('Please apply the database migration first')
      return
    }
    
    setAutoSyncLoading(true)
    try {
      const success = enabled 
        ? await autoSyncService.enableAutoSync()
        : await autoSyncService.disableAutoSync()
      
      if (success) {
        toast.success(`Auto-sync ${enabled ? 'enabled' : 'disabled'} successfully`)
        // Reload config
        const newConfig = await autoSyncService.getConfig()
        setAutoSyncConfig(newConfig)
      } else {
        toast.error(`Failed to ${enabled ? 'enable' : 'disable'} auto-sync`)
      }
    } catch {
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} auto-sync`)
    } finally {
      setAutoSyncLoading(false)
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
      const transactions = await transactionService.getAllTransactions()
      
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
          if (transaction.department && transaction.department !== 'Unassigned') {
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
                // Find department ID
                const dept = departments.find(d => d.name === department)
                if (dept) {
                  await transactionService.assignDepartment(
                    transaction.Bank,
                    new Date(transaction.Date).toISOString().split('T')[0],
                    transaction.Description,
                    transaction.net_amount,
                    dept.id
                  )
                }
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
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Auto-Sync Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Automatic Sync Configuration
              </CardTitle>
              <CardDescription>
                Configure automatic rule application for new transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!migrationApplied ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Auto-sync not available:</strong> The database migration needs to be applied first. 
                Please run <code className="bg-muted px-1 rounded">supabase db push</code> or apply the migration manually. 
                See <code>AUTO_SYNC_SETUP.md</code> for detailed instructions.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">Enable Automatic Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply department rules to new transactions as they are added
                  </p>
                </div>
                <Switch
                  checked={autoSyncConfig?.enabled || false}
                  onCheckedChange={handleAutoSyncToggle}
                  disabled={autoSyncLoading || !migrationApplied}
                />
              </div>

              {/* Auto-sync statistics */}
              {autoSyncStats && (
                <div>
                  <h3 className="font-medium mb-3">Auto-Sync Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {autoSyncStats.total_applications}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Applications</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {autoSyncStats.successful_applications}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {autoSyncStats.failed_applications}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-sm font-medium">
                        {autoSyncStats.last_application 
                          ? new Date(autoSyncStats.last_application).toLocaleString()
                          : 'Never'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Last Application</div>
                    </div>
                  </div>
                  {autoSyncStats.most_used_rule && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">Most Used Rule:</span>
                        <Badge variant="outline">{autoSyncStats.most_used_rule}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Important note */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Auto-sync behavior:</strong> Rules are automatically applied to new transactions 
                  and existing transactions without department assignments. Manual department assignments 
                  are always preserved and never overwritten.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Sync Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Manual Rule Synchronization
              </CardTitle>
              <CardDescription>
                Manually apply department assignment rules to all transactions
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
    </ErrorBoundary>
  )
}
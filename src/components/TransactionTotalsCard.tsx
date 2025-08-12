'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

interface TransactionTotals {
  total_in: number
  total_out: number
  net_balance: number
  transaction_count: number
}

interface TransactionTotalsCardProps {
  totals: TransactionTotals | null
  loading: boolean
  error?: string
}

export default function TransactionTotalsCard({ totals, loading, error }: TransactionTotalsCardProps) {
  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'SAR 0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Transaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center p-4 rounded-lg border bg-muted/20">
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Transaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load transaction summary</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!totals) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Transaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No transaction data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total In */}
          <div className="text-center p-4 rounded-lg border bg-green-50/50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Total In</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
              {formatCurrency(totals.total_in)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">
              Incoming funds
            </div>
          </div>

          {/* Total Out */}
          <div className="text-center p-4 rounded-lg border bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Total Out</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">
              {formatCurrency(totals.total_out)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-500">
              Outgoing funds
            </div>
          </div>

          {/* Net Balance */}
          <div className={`text-center p-4 rounded-lg border ${
            totals.net_balance >= 0 
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' 
              : 'bg-orange-50/50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className={`w-4 h-4 ${
                totals.net_balance >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`} />
              <span className={`text-sm font-medium ${
                totals.net_balance >= 0 
                  ? 'text-blue-700 dark:text-blue-400' 
                  : 'text-orange-700 dark:text-orange-400'
              }`}>
                Net Balance
              </span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              totals.net_balance >= 0 
                ? 'text-blue-700 dark:text-blue-400' 
                : 'text-orange-700 dark:text-orange-400'
            }`}>
              {totals.net_balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(totals.net_balance))}
            </div>
            <div className={`text-xs ${
              totals.net_balance >= 0 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-orange-600 dark:text-orange-500'
            }`}>
              {totals.net_balance >= 0 ? 'Positive balance' : 'Negative balance'}
            </div>
          </div>

          {/* Transaction Count */}
          <div className="text-center p-4 rounded-lg border bg-muted/20 dark:bg-muted/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Transactions</span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {totals.transaction_count.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Transactions found
            </div>
          </div>
        </div>

        {/* Additional Summary Info */}
        {totals.transaction_count > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Average transaction: {formatCurrency((totals.total_in + totals.total_out) / totals.transaction_count)}
              </div>
              <div>
                {totals.total_in > 0 && totals.total_out > 0 && (
                  <>In/Out Ratio: {(totals.total_in / totals.total_out).toFixed(2)}:1</>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total In Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white/90">Total In</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                formatCurrency(totals?.total_in || 0)
              )}
            </div>
            <p className="text-sm text-white/80">Incoming funds</p>
            
            {/* Progress bar effect */}
            <div className="mt-4">
              <div className="text-xs text-white/70 mb-1">Portfolio Utilization</div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: totals?.total_in && (totals.total_in + totals.total_out) > 0 
                      ? `${(totals.total_in / (totals.total_in + totals.total_out)) * 100}%` 
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {totals?.total_in && (totals.total_in + totals.total_out) > 0 
                  ? `${((totals.total_in / (totals.total_in + totals.total_out)) * 100).toFixed(1)}%`
                  : '0.0%'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Out Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white/90">Total Out</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                formatCurrency(totals?.total_out || 0)
              )}
            </div>
            <p className="text-sm text-white/80">Outgoing funds</p>
            
            {/* Progress bar effect */}
            <div className="mt-4">
              <div className="text-xs text-white/70 mb-1">Portfolio Utilization</div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: totals?.total_out && (totals.total_in + totals.total_out) > 0 
                      ? `${(totals.total_out / (totals.total_in + totals.total_out)) * 100}%` 
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {totals?.total_out && (totals.total_in + totals.total_out) > 0 
                  ? `${((totals.total_out / (totals.total_in + totals.total_out)) * 100).toFixed(1)}%`
                  : '0.0%'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Balance Card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
        (totals?.net_balance || 0) >= 0 
          ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600'
          : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white/90">Net Balance</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <>
                  {(totals?.net_balance || 0) >= 0 ? '+' : ''}
                  {formatCurrency(Math.abs(totals?.net_balance || 0))}
                </>
              )}
            </div>
            <p className="text-sm text-white/80">
              {(totals?.net_balance || 0) >= 0 ? 'Positive balance' : 'Negative balance'}
            </p>
            
            {/* Balance indicator */}
            <div className="mt-4">
              <div className="text-xs text-white/70 mb-1">Balance Status</div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full transition-all duration-500 w-full"></div>
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {(totals?.net_balance || 0) >= 0 ? 'Healthy' : 'Deficit'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Count Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white/90">Transactions</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20 bg-white/20" />
              ) : (
                (totals?.transaction_count || 0).toLocaleString()
              )}
            </div>
            <p className="text-sm text-white/80">Total records</p>
            
            {/* Activity indicator */}
            <div className="mt-4">
              <div className="text-xs text-white/70 mb-1">Activity Level</div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: totals?.transaction_count 
                      ? `${Math.min((totals.transaction_count / 200) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-white/90 mt-1 font-medium">
                {totals?.transaction_count && totals.transaction_count > 0 ? 'Active' : 'No Data'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Summary Info - Full width */}
      {totals && totals.transaction_count > 0 && (
        <div className="md:col-span-4 mt-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  <strong className="text-foreground">Average Transaction:</strong> {formatCurrency((totals.total_in + totals.total_out) / totals.transaction_count)}
                </span>
                {totals.total_in > 0 && totals.total_out > 0 && (
                  <span>
                    <strong className="text-foreground">In/Out Ratio:</strong> {(totals.total_in / totals.total_out).toFixed(2)}:1
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EnhancedUnifiedTransaction } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Link, AlertTriangle } from 'lucide-react'

interface SummaryDashboardProps {
  transactions: EnhancedUnifiedTransaction[]
}

interface DepartmentSummary {
  department: string
  totalIn: number
  totalOut: number
  netBalance: number
  transfersIn: number
  transfersOut: number
  linkedCount: number
  unlinkedCount: number
}

export default function SummaryDashboard({ transactions }: SummaryDashboardProps) {
  const summary = useMemo(() => {
    const departmentStats: Record<string, DepartmentSummary> = {}
    
    transactions.forEach(transaction => {
      const dept = transaction.source_department || 'Unassigned'
      
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          totalIn: 0,
          totalOut: 0,
          netBalance: 0,
          transfersIn: 0,
          transfersOut: 0,
          linkedCount: 0,
          unlinkedCount: 0
        }
      }
      
      const stats = departmentStats[dept]
      
      if (transaction.amount > 0) {
        stats.totalIn += transaction.amount
        stats.transfersIn += 1
      } else {
        stats.totalOut += Math.abs(transaction.amount)
        stats.transfersOut += 1
      }
      
      stats.netBalance = stats.totalIn - stats.totalOut
      
      if (transaction.transfer_group_id) {
        stats.linkedCount += 1
      } else {
        stats.unlinkedCount += 1
      }
    })
    
    return Object.values(departmentStats).sort((a, b) => 
      Math.abs(b.netBalance) - Math.abs(a.netBalance)
    )
  }, [transactions])

  const totals = useMemo(() => {
    const linked = transactions.filter(t => t.transfer_group_id).length
    const unlinked = transactions.filter(t => !t.transfer_group_id).length
    const totalIn = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const totalOut = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    return {
      linked,
      unlinked,
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
      linkingPercentage: transactions.length > 0 ? (linked / transactions.length) * 100 : 0
    }
  }, [transactions])

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const formatBalance = (balance: number) => {
    const isNegative = balance < 0
    const absBalance = Math.abs(balance)
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}${absBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transfers In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {formatAmount(totals.totalIn)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transfers Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {formatAmount(totals.totalOut)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBalance(totals.netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Linking Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {totals.linkingPercentage.toFixed(1)}%
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link className="h-3 w-3" />
                <span>{totals.linked} linked</span>
                <AlertTriangle className="h-3 w-3 ml-2" />
                <span>{totals.unlinked} unlinked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Transfers In</TableHead>
                  <TableHead className="text-right">Transfers Out</TableHead>
                  <TableHead className="text-right">Net Balance</TableHead>
                  <TableHead className="text-right">Count In/Out</TableHead>
                  <TableHead className="text-center">Linking Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell className="font-medium">
                      <Badge variant={dept.department === 'Unassigned' ? 'outline' : 'default'}>
                        {dept.department}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right text-green-600 font-mono">
                      {formatAmount(dept.totalIn)}
                    </TableCell>
                    
                    <TableCell className="text-right text-red-600 font-mono">
                      {formatAmount(dept.totalOut)}
                    </TableCell>
                    
                    <TableCell className="text-right font-mono">
                      {formatBalance(dept.netBalance)}
                    </TableCell>
                    
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dept.transfersIn} / {dept.transfersOut}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          <Link className="w-3 h-3 mr-1" />
                          {dept.linkedCount}
                        </Badge>
                        {dept.unlinkedCount > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {dept.unlinkedCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
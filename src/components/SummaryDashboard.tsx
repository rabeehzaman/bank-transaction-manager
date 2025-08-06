'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart'
import { FrontendTransaction } from '@/lib/supabase'
import { 
  TrendingUp, 
  TrendingDown, 
  Link, 
  AlertTriangle, 
  PieChart, 
  BarChart3, 
  Calendar,
  Building2
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

interface SummaryDashboardProps {
  transactions: FrontendTransaction[]
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

const chartConfig = {
  totalIn: {
    label: "Cash In",
    color: "hsl(var(--chart-1))",
  },
  totalOut: {
    label: "Cash Out", 
    color: "hsl(var(--chart-2))",
  },
  netBalance: {
    label: "Net Balance",
    color: "hsl(var(--chart-3))",
  },
}

export default function SummaryDashboard({ transactions }: SummaryDashboardProps) {
  const { departmentSummary, bankSummary, monthlyTrends, totals } = useMemo(() => {
    const departmentStats: Record<string, DepartmentSummary> = {}
    const bankStats: Record<string, { bank: string; totalIn: number; totalOut: number; count: number }> = {}
    const monthlyData: Record<string, { month: string; totalIn: number; totalOut: number; count: number }> = {}
    
    transactions.forEach(transaction => {
      const dept = transaction.department || 'Unassigned'
      const bank = transaction.Bank
      const date = new Date(transaction.Date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Department stats
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
      
      if (transaction.net_amount > 0) {
        stats.totalIn += transaction.net_amount
        stats.transfersIn += 1
      } else {
        stats.totalOut += Math.abs(transaction.net_amount)
        stats.transfersOut += 1
      }
      
      stats.netBalance = stats.totalIn - stats.totalOut
      stats.unlinkedCount += 1
      
      // Bank stats
      if (!bankStats[bank]) {
        bankStats[bank] = { bank, totalIn: 0, totalOut: 0, count: 0 }
      }
      if (transaction.net_amount > 0) {
        bankStats[bank].totalIn += transaction.net_amount
      } else {
        bankStats[bank].totalOut += Math.abs(transaction.net_amount)
      }
      bankStats[bank].count += 1
      
      // Monthly trends
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, totalIn: 0, totalOut: 0, count: 0 }
      }
      if (transaction.net_amount > 0) {
        monthlyData[monthKey].totalIn += transaction.net_amount
      } else {
        monthlyData[monthKey].totalOut += Math.abs(transaction.net_amount)
      }
      monthlyData[monthKey].count += 1
    })
    
    // Calculate totals
    const linked = 0
    const unlinked = transactions.length
    const totalIn = transactions.filter(t => t.net_amount > 0).reduce((sum, t) => sum + t.net_amount, 0)
    const totalOut = transactions.filter(t => t.net_amount < 0).reduce((sum, t) => sum + Math.abs(t.net_amount), 0)
    
    return {
      departmentSummary: Object.values(departmentStats).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance)),
      bankSummary: Object.values(bankStats).sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut)),
      monthlyTrends: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6), // Last 6 months
      totals: {
        linked,
        unlinked,
        totalIn,
        totalOut,
        netBalance: totalIn - totalOut,
        linkingPercentage: transactions.length > 0 ? (linked / transactions.length) * 100 : 0
      }
    }
  }, [transactions])

  // Color palette for charts
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>
              Transaction volume over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyTrends}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="totalIn" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="Cash In"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalOut" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Cash Out"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bank Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Bank Distribution
            </CardTitle>
            <CardDescription>
              Transaction volume by bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={bankSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ bank, percent }) => `${bank} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="bank"
                >
                  {bankSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Department Performance Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Department Performance
            </CardTitle>
            <CardDescription>
              Net balance by department (top 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={departmentSummary.slice(0, 10)}>
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar 
                  dataKey="totalIn" 
                  fill="hsl(var(--chart-1))" 
                  name="Cash In"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="totalOut" 
                  fill="hsl(var(--chart-2))" 
                  name="Cash Out"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Department Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Summary
          </CardTitle>
          <CardDescription>
            Detailed breakdown of transaction activity by department
          </CardDescription>
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
                {departmentSummary.map((dept) => (
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
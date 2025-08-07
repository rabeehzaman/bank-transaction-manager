'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Link } from 'lucide-react'
import { toast } from 'sonner'
import { 
  FrontendTransaction, 
  Department, 
  transactionService, 
  departmentService 
} from '@/lib/supabase'
import { syncManager } from '@/lib/sync-manager'


type SortField = 'date' | 'description' | 'amount' | 'bank' | 'department'
type SortOrder = 'asc' | 'desc'


interface TransactionTableNewProps {
  transactions: FrontendTransaction[]
  loading: boolean
  onDepartmentChange?: (transaction: FrontendTransaction, departmentId: string, departmentName?: string) => void
}

export default function TransactionTableNew({ 
  transactions: propTransactions, 
  loading: propLoading,
  onDepartmentChange
}: TransactionTableNewProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const transactions = propTransactions
  const loading = propLoading
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Load transactions and departments
  const loadDepartments = useCallback(async () => {
    try {
      const departmentsData = await departmentService.getAllDepartments()
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.error('Failed to load departments')
    }
  }, [])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  // Sort transactions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Sort logic
  const { filteredTransactions, sortedTransactions, totalItems } = useMemo(() => {
    // Ensure transactions is an array before processing
    if (!transactions || !Array.isArray(transactions)) {
      return {
        filteredTransactions: [],
        sortedTransactions: [],
        totalItems: 0
      }
    }

    // Sort transactions (transactions are already filtered by parent)
    const sorted = [...transactions].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.Date).getTime() - new Date(b.Date).getTime()
          break
        case 'description':
          comparison = a.Description.localeCompare(b.Description)
          break
        case 'amount':
          comparison = Math.abs(a.net_amount) - Math.abs(b.net_amount)
          break
        case 'bank':
          comparison = a.Bank.localeCompare(b.Bank)
          break
        case 'department':
          comparison = (a.department || 'Unassigned').localeCompare(b.department || 'Unassigned')
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return {
      filteredTransactions: sorted,
      sortedTransactions: sorted,
      totalItems: sorted.length
    }
  }, [transactions, sortField, sortOrder])


  // Assign department to transaction
  const handleDepartmentAssign = async (transaction: FrontendTransaction, departmentId: string) => {
    // Find department name for optimistic update
    const department = departments.find(d => d.id === departmentId)
    const departmentName = department?.name || 'Unknown'
    
    // Optimistic update: notify parent immediately
    onDepartmentChange?.(transaction, departmentId, departmentName)
    
    // Check if online
    if (!navigator.onLine) {
      // Queue for offline sync
      await syncManager.queueDepartmentAssignment(
        transaction.content_hash,
        departmentId,
        departmentName
      )
      toast.info('Department assignment queued for sync')
      return
    }
    
    try {
      await transactionService.assignDepartment(
        transaction.Bank,
        new Date(transaction.Date).toISOString().split('T')[0],
        transaction.Description,
        transaction.net_amount,
        departmentId
      )
      
      toast.success('Department assigned successfully')
    } catch (error) {
      console.error('Error assigning department:', error)
      
      // If network error, queue for offline sync
      if (error instanceof Error && error.message.includes('network')) {
        await syncManager.queueDepartmentAssignment(
          transaction.content_hash,
          departmentId,
          departmentName
        )
        toast.warning('Offline: Department assignment will sync when online')
      } else {
        toast.error('Failed to assign department')
        // Rollback: revert to original state
        onDepartmentChange?.(transaction, transaction.department_id || 'unassigned', transaction.department)
      }
    }
  }

  // Remove department assignment
  const handleDepartmentRemove = async (transaction: FrontendTransaction) => {
    // Store original values for potential rollback
    const originalDepartmentId = transaction.department_id
    const originalDepartmentName = transaction.department
    
    // Optimistic update: notify parent immediately
    onDepartmentChange?.(transaction, 'unassigned', 'Unassigned')
    
    try {
      await transactionService.removeDepartment(transaction.content_hash)
      toast.success('Department assignment removed')
    } catch (error) {
      console.error('Error removing department:', error)
      toast.error('Failed to remove department assignment')
      
      // Rollback: revert to original state
      onDepartmentChange?.(transaction, originalDepartmentId || 'unassigned', originalDepartmentName)
    }
  }

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  // Get department stats (use all filtered transactions, not just paginated)
  const departmentStats = useMemo(() => {
    const stats = departments.reduce((acc, dept) => {
      const count = filteredTransactions.filter(t => t.department === dept.name).length
      if (count > 0) {
        acc[dept.name] = count
      }
      return acc
    }, {} as Record<string, number>)

    const unassignedCount = filteredTransactions.filter(t => t.department === 'Unassigned').length
    if (unassignedCount > 0) {
      stats['Unassigned'] = unassignedCount
    }

    return stats
  }, [departments, filteredTransactions])


  if (loading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-8 w-32" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('date')}
                        className="h-8 p-0 text-left"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('description')}
                        className="h-8 p-0 text-left"
                      >
                        Description
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('amount')}
                        className="h-8 p-0 text-right"
                      >
                        Cash In
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Cash Out</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('bank')}
                        className="h-8 p-0 text-left"
                      >
                        Bank
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('department')}
                        className="h-8 p-0 text-left"
                      >
                        Department
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTransactions.map((transaction, index) => (
                      <ContextMenu key={index}>
                        <ContextMenuTrigger asChild>
                          <TableRow className="hover:bg-muted/50 cursor-pointer">
                            <TableCell className="font-mono text-sm">
                              {format(new Date(transaction.Date), 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <div className="truncate cursor-pointer hover:text-primary transition-colors">
                                    {transaction.Description}
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Transaction Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium text-muted-foreground">Description:</span>
                                        <p className="mt-1">{transaction.Description}</p>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">Date:</span>
                                        <span>{format(new Date(transaction.Date), 'MMM dd, yyyy')}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">Bank:</span>
                                        <Badge variant="outline">{transaction.Bank}</Badge>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-muted-foreground">Amount:</span>
                                        <span className={`font-mono font-medium ${transaction.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {transaction.net_amount >= 0 ? '+' : ''}${Math.abs(transaction.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      {transaction.department && (
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-muted-foreground">Department:</span>
                                          <Badge>{transaction.department}</Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {transaction['Cash In'] ? (
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(transaction['Cash In'])}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {transaction['Cash Out'] ? (
                                <span className="text-red-600 font-semibold">
                                  {formatCurrency(transaction['Cash Out'])}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{transaction.Bank}</Badge>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={transaction.department_id || 'unassigned'} 
                                onValueChange={(value) => {
                                  if (value === 'unassigned') {
                                    handleDepartmentRemove(transaction)
                                  } else {
                                    handleDepartmentAssign(transaction, value)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </ContextMenuItem>
                          <ContextMenuItem>
                            <Link className="mr-2 h-4 w-4" />
                            Link Transfer
                          </ContextMenuItem>
                          <ContextMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Transaction
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                )}
              </TableBody>
      </Table>
    </div>
  )
}
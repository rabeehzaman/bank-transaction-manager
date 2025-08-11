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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  ArrowUpDown, 
  Eye, 
  Edit, 
  Calendar,
  Building2,
  CreditCard,
  DollarSign,
  Hash,
  Tag
} from 'lucide-react'
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
  const [selectedTransaction, setSelectedTransaction] = useState<FrontendTransaction | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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
  const { filteredTransactions, sortedTransactions, totalItems: _totalItems } = useMemo(() => {
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
  const _departmentStats = useMemo(() => {
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

  // Handle transaction click to show details
  const handleTransactionClick = (transaction: FrontendTransaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }


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
                          <TableRow 
                            className="hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                            onClick={() => handleTransactionClick(transaction)}
                          >
                            <TableCell className="font-mono text-sm">
                              {format(new Date(transaction.Date), 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate hover:text-primary transition-colors">
                                {transaction.Description}
                              </div>
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
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Transaction
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                )}
              </TableBody>
      </Table>

      {/* Transaction Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedTransaction && (
            <div className="p-6">
              <SheetHeader className="space-y-4 pb-6 border-b">
                <div className="space-y-2">
                  <SheetTitle className="text-xl font-semibold">
                    Transaction Details
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    Review complete transaction information
                  </SheetDescription>
                </div>
                
                {/* Amount Display */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedTransaction.net_amount >= 0 
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                }`}>
                  <DollarSign className="h-5 w-5" />
                  <span className="text-2xl font-bold">
                    {selectedTransaction.net_amount >= 0 ? '+' : ''}
                    {formatCurrency(Math.abs(selectedTransaction.net_amount))}
                  </span>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Description Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Description</span>
                  </div>
                  <div className="pl-9">
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
                      {selectedTransaction.Description}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Date & Time</span>
                  </div>
                  <div className="pl-9">
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">Transaction Date</span>
                      <span className="text-sm font-medium">
                        {format(new Date(selectedTransaction.Date), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Financial Details</span>
                  </div>
                  <div className="pl-9 space-y-2">
                    {selectedTransaction['Cash In'] && (
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2.5">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Cash In</span>
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          +{formatCurrency(selectedTransaction['Cash In'])}
                        </span>
                      </div>
                    )}
                    {selectedTransaction['Cash Out'] && (
                      <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2.5">
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">Cash Out</span>
                        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                          -{formatCurrency(selectedTransaction['Cash Out'])}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">Net Amount</span>
                      <span className={`text-sm font-semibold ${selectedTransaction.net_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedTransaction.net_amount >= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(selectedTransaction.net_amount))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Bank Information</span>
                  </div>
                  <div className="pl-9">
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                      <span className="text-sm text-muted-foreground">Bank</span>
                      <Badge variant="outline" className="font-medium">
                        {selectedTransaction.Bank}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Department Assignment</span>
                  </div>
                  <div className="pl-9">
                    <div className="space-y-2">
                      <Select 
                        value={selectedTransaction.department_id || 'unassigned'} 
                        onValueChange={(value) => {
                          if (value === 'unassigned') {
                            handleDepartmentRemove(selectedTransaction)
                          } else {
                            handleDepartmentAssign(selectedTransaction, value)
                          }
                          // Update the selected transaction to reflect the change
                          setSelectedTransaction({
                            ...selectedTransaction,
                            department_id: value === 'unassigned' ? null : value,
                            department: value === 'unassigned' ? 'Unassigned' : (departments.find(d => d.id === value)?.name || 'Unknown')
                          })
                        }}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <span className="text-muted-foreground">Unassigned</span>
                          </SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Click to assign or change the department for this transaction
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedTransaction.content_hash && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Hash className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Transaction ID</span>
                    </div>
                    <div className="pl-9">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <code className="text-xs font-mono text-muted-foreground break-all">
                          {selectedTransaction.content_hash}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
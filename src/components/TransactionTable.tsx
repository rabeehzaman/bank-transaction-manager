'use client'

import { useState, memo, useCallback, useMemo, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnhancedUnifiedTransaction } from '@/lib/supabase'
import { Department } from '@/lib/supabase-admin'
import { format } from 'date-fns'
import { Link, AlertTriangle, CheckCircle } from 'lucide-react'

interface TransactionTableProps {
  transactions: EnhancedUnifiedTransaction[]
  onLinkTransfer: (transaction: EnhancedUnifiedTransaction) => void
  onDepartmentUpdate?: (transactionId: string, department: string) => void
  onCategoryUpdate?: (transactionId: string, category: string) => void
  loading: boolean
  departments: Department[]
  selectedDepartment: string
}

// DEPARTMENTS moved to dynamic loading from database

// Memoized transaction row component for better performance
const TransactionRow = memo(function TransactionRow({ 
  transaction, 
  isSelected, 
  onRowSelect, 
  onDepartmentChange, 
  onLinkTransfer,
  departmentValue,
  departments,
  runningTotal,
  showRunningTotal
}: {
  transaction: EnhancedUnifiedTransaction
  isSelected: boolean
  onRowSelect: (transactionId: string, checked: boolean) => void
  onDepartmentChange: (transactionId: string, department: string) => void
  onLinkTransfer: (transaction: EnhancedUnifiedTransaction) => void
  departmentValue: string
  departments: Department[]
  runningTotal?: number
  showRunningTotal: boolean
}) {
  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    )
  }

  const formatRunningTotal = (total: number) => {
    const isNegative = total < 0
    const absTotal = Math.abs(total)
    return (
      <span className={`font-mono font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
        {isNegative ? '-' : ''}${absTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    )
  }

  const getTransferStatus = (transaction: EnhancedUnifiedTransaction) => {
    if (transaction.transfer_group_id) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Linked #{transaction.transfer_group_id.slice(-8)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Unlinked
      </Badge>
    )
  }

  return (
    <TableRow className={isSelected ? 'bg-muted/50' : ''}>
      <TableCell>
        <Checkbox
          checked={!!isSelected}
          onCheckedChange={(checked) => onRowSelect(transaction.id, !!checked)}
        />
      </TableCell>
      
      <TableCell>
        {format(new Date(transaction.date), 'MMM dd, yyyy')}
      </TableCell>
      
      <TableCell className="max-w-xs">
        <div className="whitespace-normal break-words" title={transaction.description}>
          {transaction.description}
        </div>
        {transaction.reference && (
          <div className="text-xs text-muted-foreground whitespace-normal break-words">
            Ref: {transaction.reference}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        <Badge 
          variant={transaction.bank_name === 'Ahli' ? 'default' : 'secondary'}
        >
          {transaction.bank_name}
        </Badge>
      </TableCell>
      
      <TableCell className="font-mono">
        {formatAmount(transaction.amount)}
      </TableCell>

      {showRunningTotal && (
        <TableCell className="font-mono text-right">
          {runningTotal !== undefined ? formatRunningTotal(runningTotal) : '-'}
        </TableCell>
      )}
      
      <TableCell>
        <Select 
          value={departmentValue} 
          onValueChange={(value) => onDepartmentChange(transaction.id, value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      {/* Category column hidden - uncomment to enable
      <TableCell>
        <Select 
          value={categoryValue} 
          onValueChange={(value) => onCategoryChange(transaction.id, value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      */}
      
      <TableCell>
        {getTransferStatus(transaction)}
      </TableCell>
      
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLinkTransfer(transaction)}
          className="ml-2"
        >
          <Link className="w-4 h-4 mr-1" />
          {transaction.transfer_group_id ? 'Edit Link' : 'Link'}
        </Button>
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.departmentValue === nextProps.departmentValue &&
    prevProps.transaction.transfer_group_id === nextProps.transaction.transfer_group_id &&
    prevProps.departments.length === nextProps.departments.length &&
    prevProps.runningTotal === nextProps.runningTotal &&
    prevProps.showRunningTotal === nextProps.showRunningTotal
  )
})

// CSS Grid Row component for consistent layout
const GridTransactionRow = memo(function GridTransactionRow({ 
  transaction, 
  isSelected, 
  onRowSelect, 
  onDepartmentChange, 
  onLinkTransfer,
  departmentValue,
  departments,
  runningTotal,
  showRunningTotal,
  style,
  isVirtualized = false
}: {
  transaction: EnhancedUnifiedTransaction
  isSelected: boolean
  onRowSelect: (transactionId: string, checked: boolean) => void
  onDepartmentChange: (transactionId: string, department: string) => void
  onLinkTransfer: (transaction: EnhancedUnifiedTransaction) => void
  departmentValue: string
  departments: Department[]
  runningTotal?: number
  showRunningTotal: boolean
  style?: React.CSSProperties
  isVirtualized?: boolean
}) {
  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    )
  }

  const formatRunningTotal = (total: number) => {
    const isNegative = total < 0
    const absTotal = Math.abs(total)
    return (
      <span className={`font-mono font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
        {isNegative ? '-' : ''}${absTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
    )
  }

  const getTransferStatus = (transaction: EnhancedUnifiedTransaction) => {
    if (transaction.transfer_group_id) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Linked #{transaction.transfer_group_id.slice(-8)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Unlinked
      </Badge>
    )
  }

  const gridCols = showRunningTotal 
    ? "48px 120px 1fr 80px 120px 120px 140px 140px 120px"
    : "48px 120px 1fr 80px 120px 140px 140px 120px"

  const containerClasses = `grid items-center gap-3 px-3 py-3 border-b hover:bg-muted/50 ${isSelected ? 'bg-muted/50' : ''}`

  return (
    <div 
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: gridCols,
      }}
      className={containerClasses}
    >
      {/* Checkbox */}
      <div className="flex justify-center">
        <Checkbox
          checked={!!isSelected}
          onCheckedChange={(checked) => onRowSelect(transaction.id, !!checked)}
        />
      </div>
      
      {/* Date */}
      <div className="text-sm">
        {format(new Date(transaction.date), 'MMM dd, yyyy')}
      </div>
      
      {/* Description */}
      <div className="text-sm min-w-0">
        <div className="font-medium line-clamp-2 break-words" title={transaction.description}>
          {transaction.description}
        </div>
        {transaction.reference && (
          <div className="text-xs text-muted-foreground line-clamp-1 break-words">
            Ref: {transaction.reference}
          </div>
        )}
      </div>
      
      {/* Bank */}
      <div className="flex justify-center">
        <Badge 
          variant={transaction.bank_name === 'Ahli' ? 'default' : 'secondary'}
        >
          {transaction.bank_name}
        </Badge>
      </div>
      
      {/* Amount */}
      <div className="font-mono text-sm text-right">
        {formatAmount(transaction.amount)}
      </div>

      {/* Running Total (conditional) */}
      {showRunningTotal && (
        <div className="font-mono text-sm text-right">
          {runningTotal !== undefined ? formatRunningTotal(runningTotal) : '-'}
        </div>
      )}
      
      {/* Department */}
      <div>
        <Select 
          value={departmentValue} 
          onValueChange={(value) => onDepartmentChange(transaction.id, value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Transfer Status */}
      <div>
        {getTransferStatus(transaction)}
      </div>
      
      {/* Actions */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLinkTransfer(transaction)}
        >
          <Link className="w-4 h-4 mr-1" />
          {transaction.transfer_group_id ? 'Edit Link' : 'Link'}
        </Button>
      </div>
    </div>
  )
})

export default function TransactionTable({ 
  transactions, 
  onLinkTransfer, 
  onDepartmentUpdate,
  loading,
  departments,
  selectedDepartment
}: TransactionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [departmentUpdates, setDepartmentUpdates] = useState<Record<string, string>>({})

  // Clear selected rows when department filter changes
  useEffect(() => {
    setSelectedRows(new Set())
  }, [selectedDepartment])

  // Determine if we should show running total column
  const showRunningTotal = selectedDepartment !== 'all'
  
  // Define grid columns early to avoid reference errors
  const gridCols = showRunningTotal 
    ? "48px 120px 1fr 80px 120px 120px 140px 140px 120px"
    : "48px 120px 1fr 80px 120px 140px 140px 120px"

  // Sort transactions for consistent display when running total is shown
  const displayTransactions = useMemo(() => {
    if (showRunningTotal) {
      // When showing running total, sort chronologically (newest first)
      return [...transactions].sort((a, b) => {
        // Primary sort: by date (newest first)
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateComparison !== 0) {
          return dateComparison
        }
        
        // Secondary sort: by sequence_number for same-date transactions (highest first)
        const seqA = a.sequence_number || 0
        const seqB = b.sequence_number || 0
        const seqComparison = seqB - seqA
        if (seqComparison !== 0) {
          return seqComparison
        }
        
        // Tertiary sort: by transaction ID for absolute consistency
        return b.id.localeCompare(a.id)
      })
    }
    // Otherwise, keep original order (newest first)
    return transactions
  }, [transactions, showRunningTotal])

  // Calculate running totals for the selected department
  const runningTotals = useMemo(() => {
    if (!showRunningTotal) return {}
    
    let runningTotal = 0
    const totals: Record<string, number> = {}
    
    // Since department filtering is now done server-side, we can use all transactions
    // Sort chronologically (oldest first) for running total calculation
    const sortedForCalculation = [...transactions].sort((a, b) => {
      // Primary sort: by date (oldest first for running total)
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateComparison !== 0) {
        return dateComparison
      }
      
      // Secondary sort: by sequence_number for same-date transactions (lowest first)
      const seqA = a.sequence_number || 0
      const seqB = b.sequence_number || 0
      const seqComparison = seqA - seqB
      if (seqComparison !== 0) {
        return seqComparison
      }
      
      // Tertiary sort: by transaction ID for absolute consistency
      return a.id.localeCompare(b.id)
    })
    
    // Calculate running totals chronologically
    sortedForCalculation.forEach(transaction => {
      runningTotal += transaction.amount
      totals[transaction.id] = runningTotal
    })
    
    return totals
  }, [transactions, showRunningTotal])

  const handleRowSelect = useCallback((transactionId: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(transactionId)
      } else {
        newSelected.delete(transactionId)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(displayTransactions.map(t => t.id)))
    } else {
      setSelectedRows(new Set())
    }
  }, [displayTransactions])

  const handleDepartmentChange = useCallback(async (transactionId: string, department: string) => {
    setDepartmentUpdates(prev => ({
      ...prev,
      [transactionId]: department
    }))
    
    // Immediately save to database if onDepartmentUpdate is provided
    if (onDepartmentUpdate) {
      try {
        await onDepartmentUpdate(transactionId, department)
      } catch {
        // Revert the local state if the update failed
        setDepartmentUpdates(prev => {
          const newUpdates = { ...prev }
          delete newUpdates[transactionId]
          return newUpdates
        })
      }
    }
  }, [onDepartmentUpdate])


  // Virtualized row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const transaction = displayTransactions[index]
    if (!transaction) return null

    return (
      <GridTransactionRow
        transaction={transaction}
        isSelected={selectedRows.has(transaction.id)}
        onRowSelect={handleRowSelect}
        onDepartmentChange={handleDepartmentChange}
        onLinkTransfer={onLinkTransfer}
        departmentValue={departmentUpdates[transaction.id] || transaction.source_department || ''}
        departments={departments}
        runningTotal={runningTotals[transaction.id]}
        showRunningTotal={showRunningTotal}
        style={style}
        isVirtualized={true}
      />
    )
  }, [displayTransactions, selectedRows, handleRowSelect, handleDepartmentChange, onLinkTransfer, departmentUpdates, departments, runningTotals, showRunningTotal])

  // Skeleton loading component using CSS Grid
  const SkeletonRow = () => (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
      }}
      className="items-center gap-3 px-3 py-3 border-b"
    >
      <div className="flex justify-center">
        <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
      </div>
      <div><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></div>
      <div><div className="h-4 w-48 bg-muted animate-pulse rounded"></div></div>
      <div className="flex justify-center">
        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="text-right">
        <div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto"></div>
      </div>
      {showRunningTotal && (
        <div className="text-right">
          <div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto"></div>
        </div>
      )}
      <div><div className="h-8 w-32 bg-muted animate-pulse rounded"></div></div>
      <div><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></div>
      <div className="flex justify-end">
        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          {/* CSS Grid Header for loading state */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
            }}
            className="items-center gap-3 px-3 py-3 border-b bg-muted/50 font-medium text-sm"
          >
            <div className="flex justify-center">
              <Checkbox disabled />
            </div>
            <div>Date</div>
            <div>Description</div>
            <div className="text-center">Bank</div>
            <div className="text-right">Amount</div>
            {showRunningTotal && (
              <div className="text-right">Running Total</div>
            )}
            <div>Department</div>
            <div>Transfer Status</div>
            <div className="text-right">Actions</div>
          </div>
          
          {/* Skeleton rows */}
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        {/* CSS Grid Header - consistent for both views */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
          }}
          className="items-center gap-3 px-3 py-3 border-b bg-muted/50 font-medium text-sm"
        >
          {/* Checkbox */}
          <div className="flex justify-center">
            <Checkbox
              checked={displayTransactions.length > 0 && selectedRows.size === displayTransactions.length}
              onCheckedChange={handleSelectAll}
            />
          </div>
          
          {/* Date */}
          <div>Date</div>
          
          {/* Description */}
          <div>Description</div>
          
          {/* Bank */}
          <div className="text-center">Bank</div>
          
          {/* Amount */}
          <div className="text-right">Amount</div>
          
          {/* Running Total (conditional) */}
          {showRunningTotal && (
            <div className="text-right">Running Total</div>
          )}
          
          {/* Department */}
          <div>Department</div>
          
          {/* Transfer Status */}
          <div>Transfer Status</div>
          
          {/* Actions */}
          <div className="text-right">Actions</div>
        </div>

        {/* Always use virtual scrolling for consistent experience */}
        <div>
          <List
            height={Math.min(600, Math.max(400, displayTransactions.length * 80))}
            width="100%"
            itemCount={displayTransactions.length}
            itemSize={80}
            overscanCount={5}
          >
            {Row}
          </List>
        </div>
      </div>

      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between bg-muted p-3 rounded-md">
          <p className="text-sm">
            {selectedRows.size} transaction(s) selected
          </p>
          <div className="space-x-2">
            <Button variant="outline" size="sm">
              Bulk Edit Department
            </Button>
            <Button variant="outline" size="sm">
              Bulk Link Transfers
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
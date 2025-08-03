'use client'

import { useState } from 'react'
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
import { format } from 'date-fns'
import { Link, AlertTriangle, CheckCircle } from 'lucide-react'

interface TransactionTableProps {
  transactions: EnhancedUnifiedTransaction[]
  onLinkTransfer: (transaction: EnhancedUnifiedTransaction) => void
  onDepartmentUpdate?: (transactionId: string, department: string) => void
  onCategoryUpdate?: (transactionId: string, category: string) => void
  loading: boolean
}

const DEPARTMENTS = [
  'Frozen',
  'Beverages', 
  'Dairy',
  'Meat',
  'Produce',
  'Bakery',
  'General'
]

const CATEGORIES = [
  'Income',
  'Expense',
  'Transfer',
  'Refund',
  'Fee',
  'Investment',
  'Loan',
  'Other'
]

export default function TransactionTable({ 
  transactions, 
  onLinkTransfer, 
  onDepartmentUpdate,
  onCategoryUpdate,
  loading 
}: TransactionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [departmentUpdates, setDepartmentUpdates] = useState<Record<string, string>>({})
  const [categoryUpdates, setCategoryUpdates] = useState<Record<string, string>>({})

  const handleRowSelect = (transactionId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(transactionId)
    } else {
      newSelected.delete(transactionId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(transactions.map(t => t.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleDepartmentChange = async (transactionId: string, department: string) => {
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
  }

  const handleCategoryChange = async (transactionId: string, category: string) => {
    setCategoryUpdates(prev => ({
      ...prev,
      [transactionId]: category
    }))
    
    // Immediately save to database if onCategoryUpdate is provided
    if (onCategoryUpdate) {
      try {
        await onCategoryUpdate(transactionId, category)
      } catch {
        // Revert the local state if the update failed
        setCategoryUpdates(prev => {
          const newUpdates = { ...prev }
          delete newUpdates[transactionId]
          return newUpdates
        })
      }
    }
  }

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === transactions.length && transactions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Transfer Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                className={selectedRows.has(transaction.id) ? 'bg-muted/50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(transaction.id)}
                    onCheckedChange={(checked) => handleRowSelect(transaction.id, !!checked)}
                  />
                </TableCell>
                
                <TableCell>
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </TableCell>
                
                <TableCell className="max-w-xs">
                  <div className="truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                  {transaction.reference && (
                    <div className="text-xs text-muted-foreground">
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
                
                <TableCell>
                  <Select 
                    value={departmentUpdates[transaction.id] || transaction.source_department || ''} 
                    onValueChange={(value) => handleDepartmentChange(transaction.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Select 
                    value={categoryUpdates[transaction.id] || transaction.category || ''} 
                    onValueChange={(value) => handleCategoryChange(transaction.id, value)}
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
            ))}
          </TableBody>
        </Table>
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
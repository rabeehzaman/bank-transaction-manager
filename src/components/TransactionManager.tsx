'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TransactionTable from './TransactionTable'
import TransferLinkingModal from './TransferLinkingModal'
import SummaryDashboard from './SummaryDashboard'
import { transactionService, EnhancedUnifiedTransaction, PaginatedTransactions } from '@/lib/supabase'
import { toast } from 'sonner'

const DEPARTMENTS = [
  'Frozen',
  'Beverages', 
  'Dairy',
  'Meat',
  'Produce',
  'Bakery',
  'General'
]

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<EnhancedUnifiedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [linkingStatus, setLinkingStatus] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedUnifiedTransaction | null>(null)
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const nextCursorRef = useRef<string | undefined>(undefined)

  // Memoized filters object to prevent unnecessary API calls
  const filters = useMemo(() => ({
    bank: selectedBank !== 'all' ? selectedBank : undefined,
    department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    linkingStatus: linkingStatus !== 'all' ? linkingStatus : undefined,
    searchTerm: searchTerm.trim() || undefined
  }), [selectedBank, selectedDepartment, linkingStatus, searchTerm])

  // Update ref when nextCursor changes
  useEffect(() => {
    nextCursorRef.current = nextCursor
  }, [nextCursor])

  // Load initial transactions with optimized pagination
  const loadTransactions = useCallback(async (resetData = true) => {
    if (resetData) {
      setLoading(true)
      setTransactions([])
      setNextCursor(undefined)
      setHasMore(true)
      nextCursorRef.current = undefined
    } else {
      setLoadingMore(true)
    }

    try {
      const result: PaginatedTransactions = await transactionService.getTransactionsPaginated(
        100, // Load 100 transactions at a time
        resetData ? undefined : nextCursorRef.current,
        filters
      )

      if (resetData) {
        setTransactions(result.data)
      } else {
        setTransactions(prev => [...prev, ...result.data])
      }

      setHasMore(result.pagination.hasMore)
      setNextCursor(result.pagination.nextCursor)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
      if (resetData) {
        setTransactions([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters]) // Remove nextCursor from dependencies to prevent infinite loop

  // Load more transactions for infinite scroll
  const loadMoreTransactions = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadTransactions(false)
    }
  }, [loadTransactions, loadingMore, hasMore])

  // Debounced search effect to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTransactions(true)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters, loadTransactions])

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions(true)
  }, [loadTransactions])

  const handleLinkTransfer = (transaction: EnhancedUnifiedTransaction) => {
    setSelectedTransaction(transaction)
    setIsLinkingModalOpen(true)
  }

  const handleDepartmentUpdate = useCallback(async (transactionId: string, department: string) => {
    try {
      await transactionService.updateTransactionDepartment(transactionId, department)
      toast.success('Department updated successfully')
      
      // Update the transaction in the local state instead of reloading all data
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, source_department: department }
          : t
      ))
    } catch (error) {
      console.error('Error updating department:', error)
      toast.error('Failed to update department')
    }
  }, [])

  const handleCategoryUpdate = useCallback(async (transactionId: string, category: string) => {
    try {
      await transactionService.updateTransactionCategory(transactionId, category)
      toast.success('Category updated successfully')
      
      // Update the transaction in the local state instead of reloading all data
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, category: category }
          : t
      ))
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }, [])

  const handleLinkingComplete = useCallback(() => {
    setIsLinkingModalOpen(false)
    setSelectedTransaction(null)
    loadTransactions(true) // Reload to see changes
  }, [loadTransactions])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search description, amount, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Bank</label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Banks</SelectItem>
                      <SelectItem value="Ahli">Ahli Bank</SelectItem>
                      <SelectItem value="Rajhi">Rajhi Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Transfer Status</label>
                  <Select value={linkingStatus} onValueChange={setLinkingStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="linked">Linked Transfers</SelectItem>
                      <SelectItem value="unlinked">Unlinked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {transactions.length} transactions
                  {hasMore && ' (load more for additional results)'}
                </p>
                <div className="space-x-2">
                  <Button 
                    onClick={() => loadTransactions(true)} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                  {hasMore && (
                    <Button 
                      onClick={loadMoreTransactions}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable 
                transactions={transactions}
                onLinkTransfer={handleLinkTransfer}
                onDepartmentUpdate={handleDepartmentUpdate}
                onCategoryUpdate={handleCategoryUpdate}
                loading={loading}
              />
              
              {/* Load More Button at bottom of table */}
              {hasMore && !loading && (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? 'Loading more...' : `Load More Transactions`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <SummaryDashboard transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Transfer Linking Modal */}
      <TransferLinkingModal
        isOpen={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        transaction={selectedTransaction}
        onLinkingComplete={handleLinkingComplete}
      />
    </div>
  )
}
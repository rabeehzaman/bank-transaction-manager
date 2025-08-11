'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TransactionTableNew from './TransactionTableNew'
import SummaryDashboard from './SummaryDashboard'
import { transactionService, FrontendTransaction, PaginatedFrontendTransactions, departmentService, Department } from '@/lib/supabase'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import { Search, Building2, Banknote, Calendar, Filter, RefreshCw, Loader2 } from 'lucide-react'
import { syncManager } from '@/lib/sync-manager'

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<FrontendTransaction[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const nextCursorRef = useRef<string | undefined>(undefined)

  // Helper function to format date in local timezone as YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Memoized options for comboboxes
  const bankOptions: ComboboxOption[] = useMemo(() => [
    { value: 'all', label: 'All Banks', icon: <Banknote className="w-4 h-4" /> },
    { value: 'Ahli', label: 'Ahli Bank', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Rajhi', label: 'Rajhi Bank', icon: <Building2 className="w-4 h-4" /> },
    { value: 'GIB', label: 'GIB Bank', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Riyad', label: 'Riyad Bank', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Alinma', label: 'Alinma Bank', icon: <Building2 className="w-4 h-4" /> },
  ], [])

  const departmentOptions: ComboboxOption[] = useMemo(() => [
    { value: 'all', label: 'All Departments', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Unassigned', label: 'Unassigned', icon: <Filter className="w-4 h-4" /> },
    ...departments.map(dept => ({
      value: dept.name,
      label: dept.name,
      icon: <Building2 className="w-4 h-4" />
    }))
  ], [departments])


  // Memoized filters object to prevent unnecessary API calls
  const filters = useMemo(() => ({
    bank: selectedBank !== 'all' ? selectedBank : undefined,
    department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
    searchTerm: searchTerm.trim() || undefined,
    dateFrom: dateRange?.from ? formatDateForAPI(dateRange.from) : undefined,
    dateTo: dateRange?.to ? formatDateForAPI(dateRange.to) : undefined
  }), [selectedBank, selectedDepartment, searchTerm, dateRange])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.bank) count++
    if (filters.department) count++
    if (filters.searchTerm) count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }, [filters])

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
      const result: PaginatedFrontendTransactions = await transactionService.getTransactionsPaginated(
        100, // Load 100 transactions at a time
        resetData ? undefined : nextCursorRef.current,
        filters
      )

      if (resetData) {
        setTransactions(result.data)
        // Cache transactions for offline access
        if (result.data.length > 0) {
          syncManager.cacheTransactions(result.data)
        }
      } else {
        setTransactions(prev => [...prev, ...result.data])
      }

      setHasMore(result.pagination.hasMore)
      setNextCursor(result.pagination.nextCursor)
    } catch (error) {
      console.error('Error loading transactions:', error)
      
      // If offline, try to load from cache
      if (!navigator.onLine && resetData) {
        try {
          const cachedTransactions = await syncManager.getCachedTransactions()
          if (cachedTransactions.length > 0) {
            setTransactions(cachedTransactions)
            toast.info('Showing cached data (offline mode)')
            return
          }
        } catch (cacheError) {
          console.error('Failed to load cached transactions:', cacheError)
        }
      }
      
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

  // Load departments
  const loadDepartments = useCallback(async () => {
    try {
      const data = await departmentService.getAllDepartments()
      setDepartments(data.filter(d => d.is_active))
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }, [])

  // Load initial data on component mount
  useEffect(() => {
    loadTransactions(true)
    loadDepartments()
  }, [loadTransactions, loadDepartments])

  // Refresh departments when page becomes visible (e.g., returning from admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDepartments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadDepartments])


  const handleDepartmentUpdate = useCallback(async (transaction: FrontendTransaction, departmentId: string) => {
    try {
      await transactionService.assignDepartment(
        transaction.Bank,
        new Date(transaction.Date).toISOString().split('T')[0],
        transaction.Description,
        transaction.net_amount,
        departmentId
      )
      toast.success('Department updated successfully')
      
      // Reload transactions to see changes
      loadTransactions(true)
    } catch (error) {
      console.error('Error updating department:', error)
      toast.error('Failed to update department')
    }
  }, [loadTransactions])

  const handleDepartmentChange = useCallback((
    transaction: FrontendTransaction, 
    departmentId: string, 
    departmentName?: string
  ) => {
    // Optimistic update: immediately update the transaction in local state
    setTransactions(prevTransactions => 
      prevTransactions.map(t => 
        t.content_hash === transaction.content_hash 
          ? { 
              ...t, 
              department_id: departmentId === 'unassigned' ? null : departmentId,
              department: departmentName || 'Unassigned'
            }
          : t
      )
    )
  }, [])



  const clearAllFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedBank('all')
    setSelectedDepartment('all')
    setDateRange(undefined)
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Transactions Table with Integrated Filters */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Transactions</CardTitle>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount} filters
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              {/* Integrated Filters */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search
                    </Label>
                    <Input
                      id="search"
                      placeholder="Search description or amount (1000, 500.50)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                      aria-describedby="search-help"
                      autoComplete="off"
                    />
                    <p id="search-help" className="sr-only">
                      Search transactions by description text or exact amount values. Numbers search only amounts, text searches descriptions.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bank</Label>
                    <Combobox
                      options={bankOptions}
                      value={selectedBank}
                      onValueChange={setSelectedBank}
                      placeholder="Select bank"
                      searchPlaceholder="Search banks..."
                      emptyText="No banks found."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Combobox
                      options={departmentOptions}
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      placeholder="Select department"
                      searchPlaceholder="Search departments..."
                      emptyText="No departments found."
                    />
                  </div>

                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    placeholder="Select date range"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {transactions.length} transactions
                    {hasMore && ' (load more for additional results)'}
                  </p>
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => loadTransactions(true)} 
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTableNew 
                transactions={transactions}
                loading={loading}
                onDepartmentChange={handleDepartmentChange}
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

    </div>
  )
}
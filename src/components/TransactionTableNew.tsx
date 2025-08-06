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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search, Filter, ChevronDown, MoreHorizontal, ArrowUpDown, Eye, Edit, Link } from 'lucide-react'
import { toast } from 'sonner'
import { 
  FrontendTransaction, 
  Department, 
  transactionService, 
  departmentService 
} from '@/lib/supabase'

interface TransactionFilters {
  bank: string
  department: string
  searchTerm: string
  dateFrom: string
  dateTo: string
}

type SortField = 'date' | 'description' | 'amount' | 'bank' | 'department'
type SortOrder = 'asc' | 'desc'

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

export default function TransactionTableNew() {
  const [transactions, setTransactions] = useState<FrontendTransaction[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({
    bank: 'all',
    department: 'all',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  })
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0
  })
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)

  // Load transactions and departments
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [transactionsData, departmentsData] = await Promise.all([
        transactionService.getAllTransactions(),
        departmentService.getAllDepartments()
      ])
      
      setTransactions(transactionsData)
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sort transactions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Enhanced filter and sort logic with pagination
  const { filteredTransactions, paginatedTransactions, totalItems } = useMemo(() => {
    // Filter transactions
    const filtered = transactions.filter(transaction => {
      if (filters.bank !== 'all' && transaction.Bank !== filters.bank) {
        return false
      }
      
      if (filters.department !== 'all') {
        if (filters.department === 'Unassigned' && transaction.department !== 'Unassigned') {
          return false
        } else if (filters.department !== 'Unassigned' && transaction.department !== filters.department) {
          return false
        }
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        return transaction.Description.toLowerCase().includes(searchLower) ||
               transaction.Bank.toLowerCase().includes(searchLower) ||
               (transaction.department || '').toLowerCase().includes(searchLower)
      }

      if (filters.dateFrom && new Date(transaction.Date) < new Date(filters.dateFrom)) {
        return false
      }

      if (filters.dateTo && new Date(transaction.Date) > new Date(filters.dateTo)) {
        return false
      }

      return true
    })

    // Sort transactions
    filtered.sort((a, b) => {
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

    // Paginate results
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    const paginated = filtered.slice(startIndex, endIndex)

    return {
      filteredTransactions: filtered,
      paginatedTransactions: paginated,
      totalItems: filtered.length
    }
  }, [transactions, filters, sortField, sortOrder, pagination.currentPage, pagination.itemsPerPage])

  // Update pagination when filtered results change
  useEffect(() => {
    setPagination(prev => ({ ...prev, totalItems, currentPage: 1 }))
  }, [totalItems])

  // Assign department to transaction
  const handleDepartmentAssign = async (transaction: FrontendTransaction, departmentId: string) => {
    try {
      await transactionService.assignDepartment(
        transaction.Bank,
        new Date(transaction.Date).toISOString().split('T')[0],
        transaction.Description,
        transaction.net_amount,
        departmentId
      )
      
      toast.success('Department assigned successfully')
      await loadData() // Reload data to show changes
    } catch (error) {
      console.error('Error assigning department:', error)
      toast.error('Failed to assign department')
    }
  }

  // Remove department assignment
  const handleDepartmentRemove = async (transaction: FrontendTransaction) => {
    try {
      await transactionService.removeDepartment(transaction.content_hash)
      toast.success('Department assignment removed')
      await loadData() // Reload data to show changes
    } catch (error) {
      console.error('Error removing department:', error)
      toast.error('Failed to remove department assignment')
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

  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Showing {paginatedTransactions.length} of {totalItems}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t['Cash In'] || 0), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t['Cash Out'] || 0), 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Banks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-muted-foreground">Ahli, Rajhi, GIB, Riyad, Alinma</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              >
                Advanced Search
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isAdvancedSearchOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Enhanced Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search descriptions, amounts, banks..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Bank Filter */}
            <Select value={filters.bank} onValueChange={(value) => setFilters(prev => ({ ...prev, bank: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Banks</SelectItem>
                <SelectItem value="Ahli">Ahli</SelectItem>
                <SelectItem value="Rajhi">Rajhi</SelectItem>
                <SelectItem value="GIB">GIB</SelectItem>
                <SelectItem value="Riyad">Riyad</SelectItem>
                <SelectItem value="Alinma">Alinma</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Unassigned">Unassigned ({departmentStats['Unassigned'] || 0})</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name} ({departmentStats[dept.name] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />

            {/* Date To */}
            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Transactions ({totalItems})
                <Badge variant="secondary">{paginatedTransactions.length} visible</Badge>
              </CardTitle>
              <CardDescription>
                Bank transactions with department assignments • Page {pagination.currentPage} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={pagination.itemsPerPage.toString()} 
                onValueChange={(value) => setPagination(prev => ({ ...prev, itemsPerPage: Number(value), currentPage: 1 }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <ScrollArea className="h-[600px]">
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
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((transaction, index) => (
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
                              <div className="flex items-center gap-2">
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
                                {transaction.department !== 'Unassigned' && (
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.department}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Link className="mr-2 h-4 w-4" />
                                    Link Transfer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
            </ScrollArea>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, totalItems)} of {totalItems} results
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                      className={pagination.currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, Math.min(pagination.currentPage - 2, totalPages - 4))
                    const pageNum = startPage + i
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pagination.currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, pagination.currentPage + 1))}
                      className={pagination.currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
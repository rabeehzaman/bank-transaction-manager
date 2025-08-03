'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TransactionTable from './TransactionTable'
import TransferLinkingModal from './TransferLinkingModal'
import SummaryDashboard from './SummaryDashboard'
import { transactionService, EnhancedUnifiedTransaction } from '@/lib/supabase'
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
  const [filteredTransactions, setFilteredTransactions] = useState<EnhancedUnifiedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBank, setSelectedBank] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [linkingStatus, setLinkingStatus] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedUnifiedTransaction | null>(null)
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false)

  // Load transactions with metadata
  const loadTransactions = async () => {
    setLoading(true)
    try {
      const enhancedTransactions = await transactionService.getAllTransactionsWithMetadata()
      setTransactions(enhancedTransactions)
      setFilteredTransactions(enhancedTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions based on search criteria
  useEffect(() => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount?.toString().includes(searchTerm) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by bank
    if (selectedBank !== 'all') {
      filtered = filtered.filter(t => t.bank_name === selectedBank)
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(t => t.source_department === selectedDepartment)
    }

    // Filter by linking status
    if (linkingStatus === 'linked') {
      filtered = filtered.filter(t => t.transfer_group_id)
    } else if (linkingStatus === 'unlinked') {
      filtered = filtered.filter(t => !t.transfer_group_id)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, selectedBank, selectedDepartment, linkingStatus])

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions()
  }, [])

  const handleLinkTransfer = (transaction: EnhancedUnifiedTransaction) => {
    setSelectedTransaction(transaction)
    setIsLinkingModalOpen(true)
  }

  const handleDepartmentUpdate = async (transactionId: string, department: string) => {
    try {
      await transactionService.updateTransactionDepartment(transactionId, department)
      toast.success('Department updated successfully')
      loadTransactions() // Reload to see changes
    } catch (error) {
      console.error('Error updating department:', error)
      toast.error('Failed to update department')
    }
  }

  const handleCategoryUpdate = async (transactionId: string, category: string) => {
    try {
      await transactionService.updateTransactionCategory(transactionId, category)
      toast.success('Category updated successfully')
      loadTransactions() // Reload to see changes
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleLinkingComplete = () => {
    setIsLinkingModalOpen(false)
    setSelectedTransaction(null)
    loadTransactions() // Reload to see changes
  }

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
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
                <Button onClick={loadTransactions} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
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
                transactions={filteredTransactions}
                onLinkTransfer={handleLinkTransfer}
                onDepartmentUpdate={handleDepartmentUpdate}
                onCategoryUpdate={handleCategoryUpdate}
                loading={loading}
              />
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
        allTransactions={transactions}
        onLinkingComplete={handleLinkingComplete}
      />
    </div>
  )
}
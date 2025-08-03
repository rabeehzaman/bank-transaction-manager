'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EnhancedUnifiedTransaction, transactionService } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { Search, Link, Unlink } from 'lucide-react'

interface TransferLinkingModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: EnhancedUnifiedTransaction | null
  allTransactions: EnhancedUnifiedTransaction[]
  onLinkingComplete: () => void
}

export default function TransferLinkingModal({
  isOpen,
  onClose,
  transaction,
  allTransactions,
  onLinkingComplete
}: TransferLinkingModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [potentialMatches, setPotentialMatches] = useState<EnhancedUnifiedTransaction[]>([])
  const [selectedMatch, setSelectedMatch] = useState<EnhancedUnifiedTransaction | null>(null)
  const [linking, setLinking] = useState(false)

  // Find potential matches when transaction changes
  useEffect(() => {
    if (!transaction) {
      setPotentialMatches([])
      return
    }

    // Find potential matches based on:
    // 1. Same absolute amount but opposite sign
    // 2. Different bank
    // 3. Date within reasonable range (±30 days)
    const targetAmount = Math.abs(transaction.amount)
    const transactionDate = new Date(transaction.date)
    const thirtyDaysAgo = new Date(transactionDate)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysLater = new Date(transactionDate)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const matches = allTransactions.filter(t => {
      if (t.id === transaction.id) return false // Don't match with self
      if (t.bank_name === transaction.bank_name) return false // Different bank only
      
      const tDate = new Date(t.date)
      const tAmount = Math.abs(t.amount)
      
      return (
        tAmount === targetAmount && // Same absolute amount
        tDate >= thirtyDaysAgo && tDate <= thirtyDaysLater && // Within date range
        Math.sign(t.amount) !== Math.sign(transaction.amount) // Opposite signs (one positive, one negative)
      )
    })

    // Sort by date proximity
    matches.sort((a, b) => {
      const aDateDiff = Math.abs(new Date(a.date).getTime() - transactionDate.getTime())
      const bDateDiff = Math.abs(new Date(b.date).getTime() - transactionDate.getTime())
      return aDateDiff - bDateDiff
    })

    setPotentialMatches(matches)
  }, [transaction, allTransactions])

  // Filter matches based on search term
  const filteredMatches = potentialMatches.filter(t =>
    searchTerm === '' ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLinkTransactions = async () => {
    if (!transaction || !selectedMatch) return

    setLinking(true)
    try {
      await transactionService.linkTransfers(
        transaction.id,
        selectedMatch.id,
        transaction.source_department
      )

      toast.success('Transactions linked successfully!')
      onLinkingComplete()
      onClose()
    } catch (error) {
      console.error('Error linking transactions:', error)
      toast.error('Failed to link transactions')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkTransaction = async () => {
    if (!transaction?.transfer_group_id) return

    setLinking(true)
    try {
      await transactionService.unlinkTransfer(transaction.transfer_group_id)
      toast.success('Transaction unlinked successfully!')
      onLinkingComplete()
      onClose()
    } catch (error) {
      console.error('Error unlinking:', error)
      toast.error('Failed to unlink transaction')
    } finally {
      setLinking(false)
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

  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction.transfer_group_id ? 'Edit Transfer Link' : 'Link Transfer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Transaction */}
          <div>
            <h3 className="font-semibold mb-2">Selected Transaction</h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Date</label>
                    <p className="font-medium">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Bank</label>
                    <p>
                      <Badge variant={transaction.bank_name === 'Ahli' ? 'default' : 'secondary'}>
                        {transaction.bank_name}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Amount</label>
                    <p className="font-mono">{formatAmount(transaction.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <p>
                      {transaction.transfer_group_id ? (
                        <Badge variant="default">Linked</Badge>
                      ) : (
                        <Badge variant="outline">Unlinked</Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="truncate">{transaction.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Matches */}
          {!transaction.transfer_group_id && (
            <div>
              <h3 className="font-semibold mb-2">Find Matching Transfer</h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search potential matches by description or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMatches.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No potential matches found. Try searching or linking manually.
                  </p>
                ) : (
                  filteredMatches.map((match) => (
                    <Card 
                      key={match.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedMatch?.id === match.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <CardContent className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            {format(new Date(match.date), 'MMM dd')}
                          </div>
                          <div>
                            <Badge variant={match.bank_name === 'Ahli' ? 'default' : 'secondary'} className="text-xs">
                              {match.bank_name}
                            </Badge>
                          </div>
                          <div className="font-mono">
                            {formatAmount(match.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.abs(new Date(match.date).getTime() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24)} days apart
                          </div>
                        </div>
                        <div className="mt-1 text-sm truncate">
                          {match.description}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {transaction.transfer_group_id ? (
            <Button 
              variant="destructive" 
              onClick={handleUnlinkTransaction}
              disabled={linking}
            >
              <Unlink className="w-4 h-4 mr-2" />
              {linking ? 'Unlinking...' : 'Unlink'}
            </Button>
          ) : (
            <Button 
              onClick={handleLinkTransactions}
              disabled={!selectedMatch || linking}
            >
              <Link className="w-4 h-4 mr-2" />
              {linking ? 'Linking...' : 'Link Transactions'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { FrontendTransaction } from '@/lib/supabase'
// transactionService not currently used since transfer linking is disabled
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Search, Link, Unlink, Loader2, AlertTriangle } from 'lucide-react'

interface TransferLinkingModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FrontendTransaction | null
  onLinkingComplete: () => void
}

export default function TransferLinkingModal({
  isOpen,
  onClose,
  transaction,
  onLinkingComplete: _onLinkingComplete // Unused but kept for interface compatibility
}: TransferLinkingModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [potentialMatches, setPotentialMatches] = useState<FrontendTransaction[]>([])
  const [selectedMatch, setSelectedMatch] = useState<FrontendTransaction | null>(null)
  const [linking, setLinking] = useState(false)
  const [loading, setLoading] = useState(false)

  // Find potential matches when transaction changes or search term updates
  useEffect(() => {
    if (!transaction) {
      setPotentialMatches([])
      return
    }

    // Debounce the search to avoid excessive API calls
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        // Transfer matching not implemented in simplified system yet
        setPotentialMatches([])
        toast.info('Transfer linking feature is not yet available in the new system')
      } catch (error) {
        console.error('Error finding transfer matches:', error)
        toast.error('Failed to find potential matches')
        setPotentialMatches([])
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [transaction, searchTerm])

  // Since search is now handled server-side, we don't need client-side filtering
  const filteredMatches = potentialMatches

  const handleLinkTransactions = async () => {
    if (!transaction || !selectedMatch) return

    setLinking(true)
    try {
      // Transfer linking not implemented in simplified system yet
      toast.info('Transfer linking feature is not yet available')
      onClose()
    } catch (error) {
      console.error('Error linking transactions:', error)
      toast.error('Failed to link transactions')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkTransaction = async () => {
    // Transfer unlinking not available in simplified system
    return

    setLinking(true)
    try {
      // Transfer unlinking not implemented in simplified system yet
      toast.info('Transfer unlinking feature is not yet available')
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
            {false ? 'Edit Transfer Link' : 'Link Transfer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Transaction */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Selected Transaction
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Date</Label>
                    <p className="font-medium">{format(new Date(transaction.Date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank</Label>
                    <p>
                      <Badge variant="default">
                        {transaction.Bank}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount</Label>
                    <p className="font-mono">{formatAmount(transaction.net_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p>
                      {false ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Link className="w-3 h-3 mr-1" />
                          Linked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Unlink className="w-3 h-3 mr-1" />
                          Unlinked
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{transaction.Description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Matches */}
          {!false && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Find Matching Transfer
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="match-search">Search for potential matches</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="match-search"
                      placeholder="Search by description, reference, or amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-muted-foreground">Searching for potential matches...</span>
                      </div>
                      {/* Loading skeletons */}
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-12" />
                            </div>
                            <Skeleton className="h-4 w-full mt-2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredMatches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">No potential matches found</p>
                      <p className="text-sm">Try adjusting your search terms or check different date ranges</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Found {filteredMatches.length} potential matches
                      </p>
                      {filteredMatches.map((match) => (
                        <Card 
                          key={match.content_hash} 
                          className={`cursor-pointer transition-colors ${
                            selectedMatch?.content_hash === match.content_hash ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <CardContent className="p-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Date: </span>
                                {format(new Date(match.Date), 'MMM dd')}
                              </div>
                              <div>
                                <Badge variant="default" className="text-xs">
                                  {match.Bank}
                                </Badge>
                              </div>
                              <div className="font-mono">
                                {formatAmount(match.net_amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.abs(new Date(match.Date).getTime() - new Date(transaction.Date).getTime()) / (1000 * 60 * 60 * 24)} days apart
                              </div>
                            </div>
                            <div className="mt-1 text-sm truncate">
                              {match.Description}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={linking}>
            Cancel
          </Button>
          
          {false ? (
            <Button 
              variant="destructive" 
              onClick={handleUnlinkTransaction}
              disabled={linking}
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink Transaction
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleLinkTransactions}
              disabled={!selectedMatch || linking}
              className="min-w-[140px]"
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Link Transactions
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
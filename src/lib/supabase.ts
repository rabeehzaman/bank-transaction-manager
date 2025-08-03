import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if both URL and key are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Type definitions for our database tables (actual view columns)
export interface TransactionLedgerRow {
  Date: string
  'Transaction Details': string
  'Cash In': number | null
  'Cash Out': number | null
  'Bank Balance': number
  account_number: string
  sequence_number: number
}

export interface AhliLedgerRow {
  Date: string
  'Transaction Details': string
  Reference?: string
  'Cash In': number | null
  'Cash Out': number | null
  'Bank Balance': number
  account_number: string
  sequence_number: number
}

export interface UnifiedTransaction {
  id: string
  date: string
  description: string
  amount: number
  bank_name: 'Rajhi' | 'Ahli'
  source_department?: string
  category?: string
  transfer_group_id?: string
  reference?: string
  balance?: number
  account_number?: string
  sequence_number?: number
}

export interface LinkedTransfer {
  id: string
  transaction_id_1: string
  transaction_id_2: string
  source_department?: string
  created_at: string
  created_by?: string
  updated_at?: string
}

export interface TransactionTag {
  id: string
  transaction_id: string
  source_department?: string
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

// Enhanced UnifiedTransaction that includes linked transfer data
export interface EnhancedUnifiedTransaction extends UnifiedTransaction {
  linked_transfer?: LinkedTransfer
  tags?: TransactionTag
}

// Pagination interface
export interface PaginationInfo {
  hasMore: boolean
  nextCursor?: string
  total?: number
}

export interface PaginatedTransactions {
  data: EnhancedUnifiedTransaction[]
  pagination: PaginationInfo
}

// Utility functions for data operations
export const transactionService = {
  // Fetch all transactions with their links and tags (optimized with pagination)
  async getAllTransactionsWithMetadata(): Promise<EnhancedUnifiedTransaction[]> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    try {
      const [ahliResult, rajhiResult, linksResult, tagsResult] = await Promise.all([
        supabase.from('ahli_ledger').select('*').order('Date', { ascending: false }),
        supabase.from('transaction_ledger').select('*').order('Date', { ascending: false }),
        supabase.from('linked_transfers').select('*'),
        supabase.from('transaction_tags').select('*')
      ])

      if (ahliResult.error) throw ahliResult.error
      if (rajhiResult.error) throw rajhiResult.error
      if (linksResult.error) throw linksResult.error
      if (tagsResult.error) throw tagsResult.error

      const links = linksResult.data || []
      const tags = tagsResult.data || []

      // Create lookup maps
      const linksByTransaction = new Map<string, LinkedTransfer>()
      const tagsByTransaction = new Map<string, TransactionTag>()

      links.forEach(link => {
        linksByTransaction.set(link.transaction_id_1, link)
        linksByTransaction.set(link.transaction_id_2, link)
      })

      tags.forEach(tag => {
        tagsByTransaction.set(tag.transaction_id, tag)
      })

      // Transform and combine transactions
      const combinedTransactions: EnhancedUnifiedTransaction[] = [
        // Process Ahli transactions
        ...(ahliResult.data || []).map((t: AhliLedgerRow) => {
          const transactionId = `ahli_${t.account_number}_${t.sequence_number}_${t.Date}`
          const amount = (t['Cash In'] || 0) - (t['Cash Out'] || 0)
          const tagData = tagsByTransaction.get(transactionId)
          const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
          const category = categoryTag ? categoryTag.replace('category:', '') : undefined
          
          return {
            id: transactionId,
            date: t.Date,
            description: t['Transaction Details'],
            amount: amount,
            bank_name: 'Ahli' as const,
            reference: t.Reference,
            balance: t['Bank Balance'],
            account_number: t.account_number,
            sequence_number: t.sequence_number,
            transfer_group_id: linksByTransaction.get(transactionId)?.id,
            source_department: tagData?.source_department,
            category: category,
            linked_transfer: linksByTransaction.get(transactionId),
            tags: tagData
          }
        }),
        // Process Rajhi transactions
        ...(rajhiResult.data || []).map((t: TransactionLedgerRow) => {
          const transactionId = `rajhi_${t.account_number}_${t.sequence_number}_${t.Date}`
          const amount = (t['Cash In'] || 0) - (t['Cash Out'] || 0)
          const tagData = tagsByTransaction.get(transactionId)
          const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
          const category = categoryTag ? categoryTag.replace('category:', '') : undefined
          
          return {
            id: transactionId,
            date: t.Date,
            description: t['Transaction Details'],
            amount: amount,
            bank_name: 'Rajhi' as const,
            balance: t['Bank Balance'],
            account_number: t.account_number,
            sequence_number: t.sequence_number,
            transfer_group_id: linksByTransaction.get(transactionId)?.id,
            source_department: tagData?.source_department,
            category: category,
            linked_transfer: linksByTransaction.get(transactionId),
            tags: tagData
          }
        })
      ]

      // Sort by date descending
      combinedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return combinedTransactions
    } catch (error) {
      console.error('Error fetching transactions with metadata:', error)
      throw error
    }
  },

  // New cursor-based pagination method for better performance
  async getTransactionsPaginated(
    limit = 50,
    cursor?: string,
    filters?: {
      bank?: string
      department?: string
      linkingStatus?: string
      searchTerm?: string
    }
  ): Promise<PaginatedTransactions> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return { data: [], pagination: { hasMore: false } }
    }

    try {
      // Build queries with cursor-based pagination
      let ahliQuery = supabase
        .from('ahli_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('sequence_number', { ascending: false })
        .limit(Math.ceil(limit / 2))

      let rajhiQuery = supabase
        .from('bank_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('sequence_number', { ascending: false })
        .limit(Math.ceil(limit / 2))

      // Apply cursor if provided
      if (cursor) {
        const cursorDate = cursor
        ahliQuery = ahliQuery.lt('transaction_date', cursorDate)
        rajhiQuery = rajhiQuery.lt('transaction_date', cursorDate)
      }

      // Apply filters
      if (filters?.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`
        ahliQuery = ahliQuery.or(`transaction_description.ilike.${searchTerm},reference_number.ilike.${searchTerm}`)
        rajhiQuery = rajhiQuery.or(`description.ilike.${searchTerm},reference_number.ilike.${searchTerm}`)
      }

      const [ahliResult, rajhiResult, linksResult, tagsResult] = await Promise.all([
        ahliQuery,
        rajhiQuery,
        supabase.from('linked_transfers').select('*'),
        supabase.from('transaction_tags').select('*')
      ])

      if (ahliResult.error) throw ahliResult.error
      if (rajhiResult.error) throw rajhiResult.error
      if (linksResult.error) throw linksResult.error
      if (tagsResult.error) throw tagsResult.error

      const links = linksResult.data || []
      const tags = tagsResult.data || []

      // Create lookup maps
      const linksByTransaction = new Map<string, LinkedTransfer>()
      const tagsByTransaction = new Map<string, TransactionTag>()

      links.forEach(link => {
        linksByTransaction.set(link.transaction_id_1, link)
        linksByTransaction.set(link.transaction_id_2, link)
      })

      tags.forEach(tag => {
        tagsByTransaction.set(tag.transaction_id, tag)
      })

      // Transform transactions
      const combinedTransactions: EnhancedUnifiedTransaction[] = [
        // Process Ahli transactions
        ...(ahliResult.data || []).map((t: Record<string, unknown>) => {
          const transactionId = `ahli_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
          const amount = ((t.credit as number) || 0) - ((t.debit as number) || 0)
          const tagData = tagsByTransaction.get(transactionId)
          const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
          const category = categoryTag ? categoryTag.replace('category:', '') : undefined
          
          return {
            id: transactionId,
            date: t.transaction_date as string,
            description: (t.transaction_description as string) || '',
            amount: amount,
            bank_name: 'Ahli' as const,
            reference: t.reference_number as string,
            balance: t.balance as number,
            account_number: t.account_number as string,
            sequence_number: t.sequence_number as number,
            transfer_group_id: linksByTransaction.get(transactionId)?.id,
            source_department: tagData?.source_department,
            category: category,
            linked_transfer: linksByTransaction.get(transactionId),
            tags: tagData
          }
        }),
        // Process Rajhi transactions
        ...(rajhiResult.data || []).map((t: Record<string, unknown>) => {
          const transactionId = `rajhi_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
          const amount = ((t.credit as number) || 0) - ((t.debit as number) || 0)
          const tagData = tagsByTransaction.get(transactionId)
          const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
          const category = categoryTag ? categoryTag.replace('category:', '') : undefined
          
          return {
            id: transactionId,
            date: t.transaction_date as string,
            description: (t.description as string) || '',
            amount: amount,
            bank_name: 'Rajhi' as const,
            balance: t.balance as number,
            account_number: t.account_number as string,
            sequence_number: t.sequence_number as number,
            transfer_group_id: linksByTransaction.get(transactionId)?.id,
            source_department: tagData?.source_department,
            category: category,
            linked_transfer: linksByTransaction.get(transactionId),
            tags: tagData
          }
        })
      ]

      // Sort by date descending
      combinedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Apply additional filters
      let filteredTransactions = combinedTransactions

      if (filters?.bank && filters.bank !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.bank_name === filters.bank)
      }

      if (filters?.department && filters.department !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.source_department === filters.department)
      }

      if (filters?.linkingStatus) {
        if (filters.linkingStatus === 'linked') {
          filteredTransactions = filteredTransactions.filter(t => t.transfer_group_id)
        } else if (filters.linkingStatus === 'unlinked') {
          filteredTransactions = filteredTransactions.filter(t => !t.transfer_group_id)
        }
      }

      // Take only the requested limit
      const paginatedTransactions = filteredTransactions.slice(0, limit)
      
      // Determine if there are more records
      const hasMore = filteredTransactions.length === limit
      const nextCursor = hasMore && paginatedTransactions.length > 0 
        ? paginatedTransactions[paginatedTransactions.length - 1].date 
        : undefined

      return {
        data: paginatedTransactions,
        pagination: {
          hasMore,
          nextCursor
        }
      }
    } catch (error) {
      console.error('Error fetching paginated transactions:', error)
      throw error
    }
  },

  // Update or create transaction department tag
  async updateTransactionDepartment(transactionId: string, department: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('transaction_tags')
        .upsert({
          transaction_id: transactionId,
          source_department: department,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'transaction_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction department:', error)
      throw error
    }
  },

  // Update or create transaction category
  async updateTransactionCategory(transactionId: string, category: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      // First get existing tags to preserve them
      const { data: existing } = await supabase
        .from('transaction_tags')
        .select('tags')
        .eq('transaction_id', transactionId)
        .single()

      const existingTags = existing?.tags || []
      const categoryTags = existingTags.filter((tag: string) => !tag.startsWith('category:'))
      categoryTags.push(`category:${category}`)

      const { error } = await supabase
        .from('transaction_tags')
        .upsert({
          transaction_id: transactionId,
          tags: categoryTags,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'transaction_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction category:', error)
      throw error
    }
  },

  // Update both department and category
  async updateTransactionMetadata(transactionId: string, department?: string, category?: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      // Get existing data
      const { data: existing } = await supabase
        .from('transaction_tags')
        .select('*')
        .eq('transaction_id', transactionId)
        .single()

      const existingTags = existing?.tags || []
      const updatedTags = existingTags.filter((tag: string) => !tag.startsWith('category:'))
      
      if (category) {
        updatedTags.push(`category:${category}`)
      }

      const updateData: Record<string, unknown> = {
        transaction_id: transactionId,
        tags: updatedTags,
        updated_at: new Date().toISOString()
      }

      if (department !== undefined) {
        updateData.source_department = department
      }

      const { error } = await supabase
        .from('transaction_tags')
        .upsert(updateData, {
          onConflict: 'transaction_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating transaction metadata:', error)
      throw error
    }
  },

  // Create a transfer link
  async linkTransfers(transaction1Id: string, transaction2Id: string, department?: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      // Generate UUID using a more compatible method
      const transferGroupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      const { error } = await supabase
        .from('linked_transfers')
        .insert({
          id: transferGroupId,
          transaction_id_1: transaction1Id,
          transaction_id_2: transaction2Id,
          source_department: department,
          created_by: 'user'
        })

      if (error) throw error
      return transferGroupId
    } catch (error) {
      console.error('Error linking transfers:', error)
      throw error
    }
  },

  // Remove a transfer link
  async unlinkTransfer(transferGroupId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('linked_transfers')
        .delete()
        .eq('id', transferGroupId)

      if (error) throw error
    } catch (error) {
      console.error('Error unlinking transfer:', error)
      throw error
    }
  }
}
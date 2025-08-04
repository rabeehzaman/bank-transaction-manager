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
        supabase.from('ahli_transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('bank_transactions').select('*').order('transaction_date', { ascending: false }),
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
        ...(ahliResult.data || []).map((t: Record<string, unknown>) => {
          const transactionId = `ahli_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
          const amount = ((t.credit as number) || 0) - ((t.debit as number) || 0)
          const tagData = tagsByTransaction.get(transactionId)
          const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
          const category = categoryTag ? categoryTag.replace('category:', '') : undefined
          
          // Concatenate all description fields for complete information
          const descriptionParts = [
            t.transaction_description as string,
            t.description_detail as string,
            t.description_extra as string
          ].filter(part => part && part.trim().length > 0)
          const fullDescription = descriptionParts.join(' - ')
          
          return {
            id: transactionId,
            date: t.transaction_date as string,
            description: fullDescription || '',
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

      return combinedTransactions
    } catch (error) {
      console.error('Error fetching transactions with metadata:', error)
      throw error
    }
  },

  // Optimized cursor-based pagination method with server-side filtering
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
      // Build queries with server-side filtering and cursor-based pagination
      let ahliQuery = supabase
        .from('ahli_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('sequence_number', { ascending: false })

      let rajhiQuery = supabase
        .from('bank_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('sequence_number', { ascending: false })

      // Apply cursor if provided
      if (cursor) {
        const cursorDate = cursor
        ahliQuery = ahliQuery.lt('transaction_date', cursorDate)
        rajhiQuery = rajhiQuery.lt('transaction_date', cursorDate)
      }

      // Apply server-side filters for better performance
      if (filters?.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`
        ahliQuery = ahliQuery.or(`transaction_description.ilike.${searchTerm},reference_number.ilike.${searchTerm}`)
        rajhiQuery = rajhiQuery.or(`description.ilike.${searchTerm},reference_number.ilike.${searchTerm}`)
      }

      // If department filter is applied, we need to get more data initially
      // since department filtering happens client-side after joining with tags
      const fetchLimit = filters?.department && filters.department !== 'all' ? limit * 3 : limit

      // Bank filter - only query the relevant bank's table
      let ahliResult, rajhiResult
      if (filters?.bank === 'Ahli') {
        ahliResult = await ahliQuery.limit(fetchLimit)
        rajhiResult = { data: [], error: null }
      } else if (filters?.bank === 'Rajhi') {
        rajhiResult = await rajhiQuery.limit(fetchLimit)
        ahliResult = { data: [], error: null }
      } else {
        // Default: query both banks with half limit each
        const [ahliRes, rajhiRes] = await Promise.all([
          ahliQuery.limit(Math.ceil(fetchLimit / 2)),
          rajhiQuery.limit(Math.ceil(fetchLimit / 2))
        ])
        ahliResult = ahliRes
        rajhiResult = rajhiRes
      }

      if (ahliResult.error) throw ahliResult.error
      if (rajhiResult.error) throw rajhiResult.error

      // Get transaction IDs for fetching only relevant links and tags
      const allTransactions = [...(ahliResult.data || []), ...(rajhiResult.data || [])]
      const transactionIds = allTransactions.map(t => {
        if ('transaction_description' in t) {
          // Ahli transaction
          return `ahli_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
        } else {
          // Rajhi transaction
          return `rajhi_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
        }
      })

      // Fetch only relevant links and tags for current page transactions
      const [linksResult, tagsResult] = await Promise.all([
        transactionIds.length > 0 
          ? supabase.from('linked_transfers').select('*').or(
              `transaction_id_1.in.(${transactionIds.join(',')}),transaction_id_2.in.(${transactionIds.join(',')})`
            )
          : Promise.resolve({ data: [], error: null }),
        transactionIds.length > 0 
          ? supabase.from('transaction_tags').select('*').in('transaction_id', transactionIds)
          : Promise.resolve({ data: [], error: null })
      ])

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
          
          // Concatenate all description fields for complete information
          const descriptionParts = [
            t.transaction_description as string,
            t.description_detail as string,
            t.description_extra as string
          ].filter(part => part && part.trim().length > 0)
          const fullDescription = descriptionParts.join(' - ')
          
          return {
            id: transactionId,
            date: t.transaction_date as string,
            description: fullDescription || '',
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

      // Apply remaining client-side filters
      let filteredTransactions = combinedTransactions

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
      const hasMore = paginatedTransactions.length === limit
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

  // Find potential transfer matches with pagination for better performance
  async findTransferMatches(
    transaction: EnhancedUnifiedTransaction,
    searchTerm?: string,
    limit = 20
  ): Promise<EnhancedUnifiedTransaction[]> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    try {
      // Calculate date range (±30 days)
      const targetAmount = Math.abs(transaction.amount)
      const transactionDate = new Date(transaction.date)
      const thirtyDaysAgo = new Date(transactionDate)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysLater = new Date(transactionDate)
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      const endDate = thirtyDaysLater.toISOString().split('T')[0]

      // Determine which bank to search (opposite of current transaction)
      const searchBank = transaction.bank_name === 'Ahli' ? 'rajhi' : 'ahli'
      
      let query
      if (searchBank === 'ahli') {
        query = supabase
          .from('ahli_transactions')
          .select('*')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .or(`credit.eq.${targetAmount},debit.eq.${targetAmount}`)
          .order('transaction_date', { ascending: false })
          .limit(limit)
      } else {
        query = supabase
          .from('bank_transactions')
          .select('*')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .or(`credit.eq.${targetAmount},debit.eq.${targetAmount}`)
          .order('transaction_date', { ascending: false })
          .limit(limit)
      }

      // Apply search term filter if provided
      if (searchTerm) {
        if (searchBank === 'ahli') {
          query = query.or(`transaction_description.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`)
        } else {
          query = query.or(`description.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`)
        }
      }

      const result = await query

      if (result.error) throw result.error

      const transactions = result.data || []
      
      // Get transaction IDs for fetching links and tags
      const transactionIds = transactions.map(t => {
        if (searchBank === 'ahli') {
          return `ahli_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
        } else {
          return `rajhi_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
        }
      })

      // Fetch relevant links and tags
      const [linksResult, tagsResult] = await Promise.all([
        transactionIds.length > 0 
          ? supabase.from('linked_transfers').select('*').or(
              `transaction_id_1.in.(${transactionIds.join(',')}),transaction_id_2.in.(${transactionIds.join(',')})`
            )
          : Promise.resolve({ data: [], error: null }),
        transactionIds.length > 0 
          ? supabase.from('transaction_tags').select('*').in('transaction_id', transactionIds)
          : Promise.resolve({ data: [], error: null })
      ])

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

      // Transform transactions to unified format
      const transformedTransactions: EnhancedUnifiedTransaction[] = transactions.map((t: Record<string, unknown>) => {
        const transactionId = searchBank === 'ahli' 
          ? `ahli_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
          : `rajhi_${t.account_number}_${t.sequence_number}_${t.transaction_date}`
        
        const amount = searchBank === 'ahli'
          ? ((t.credit as number) || 0) - ((t.debit as number) || 0)
          : ((t.credit as number) || 0) - ((t.debit as number) || 0)
        
        const tagData = tagsByTransaction.get(transactionId)
        const categoryTag = tagData?.tags?.find((tag: string) => tag.startsWith('category:'))
        const category = categoryTag ? categoryTag.replace('category:', '') : undefined
        
        // Build description based on bank type
        let description: string
        if (searchBank === 'ahli') {
          // Concatenate all description fields for Ahli transactions
          const descriptionParts = [
            t.transaction_description as string,
            t.description_detail as string,
            t.description_extra as string
          ].filter(part => part && part.trim().length > 0)
          description = descriptionParts.join(' - ') || ''
        } else {
          description = (t.description as string) || ''
        }
        
        return {
          id: transactionId,
          date: t.transaction_date as string,
          description: description,
          amount: amount,
          bank_name: searchBank === 'ahli' ? 'Ahli' as const : 'Rajhi' as const,
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
      })

      // Filter results to only include valid matches
      const validMatches = transformedTransactions.filter(t => {
        // Don't match with self
        if (t.id === transaction.id) return false
        
        // Must be different bank
        if (t.bank_name === transaction.bank_name) return false
        
        // Must have same absolute amount but opposite sign
        const tAmount = Math.abs(t.amount)
        return tAmount === targetAmount && Math.sign(t.amount) !== Math.sign(transaction.amount)
      })

      // Sort by date proximity (closest dates first)
      validMatches.sort((a, b) => {
        const aDateDiff = Math.abs(new Date(a.date).getTime() - transactionDate.getTime())
        const bDateDiff = Math.abs(new Date(b.date).getTime() - transactionDate.getTime())
        return aDateDiff - bDateDiff
      })

      return validMatches
    } catch (error) {
      console.error('Error finding transfer matches:', error)
      throw error
    }
  },

  // Get dashboard summary data efficiently using aggregated queries
  async getDashboardSummary(): Promise<{
    departmentStats: Record<string, {
      department: string
      totalIn: number
      totalOut: number
      netBalance: number
      transfersIn: number
      transfersOut: number
      linkedCount: number
      unlinkedCount: number
    }>
    overallStats: {
      totalTransactions: number
      totalLinked: number
      totalUnlinked: number
      totalIn: number
      totalOut: number
      netBalance: number
    }
  }> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return {
        departmentStats: {},
        overallStats: {
          totalTransactions: 0,
          totalLinked: 0,
          totalUnlinked: 0,
          totalIn: 0,
          totalOut: 0,
          netBalance: 0
        }
      }
    }

    try {
      // For now, use the existing method to get transaction data
      // In production, you would create database functions for better performance
      const transactions = await this.getAllTransactionsWithMetadata()
      
      const departmentStats: Record<string, {
        department: string
        totalIn: number
        totalOut: number
        netBalance: number
        transfersIn: number
        transfersOut: number
        linkedCount: number
        unlinkedCount: number
      }> = {}
      let totalTransactions = 0
      let totalLinked = 0
      let totalUnlinked = 0
      let totalIn = 0
      let totalOut = 0

      transactions.forEach(transaction => {
        const dept = transaction.source_department || 'Unassigned'
        
        if (!departmentStats[dept]) {
          departmentStats[dept] = {
            department: dept,
            totalIn: 0,
            totalOut: 0,
            netBalance: 0,
            transfersIn: 0,
            transfersOut: 0,
            linkedCount: 0,
            unlinkedCount: 0
          }
        }

        const stats = departmentStats[dept]
        totalTransactions++

        if (transaction.amount > 0) {
          stats.totalIn += transaction.amount
          stats.transfersIn++
          totalIn += transaction.amount
        } else {
          stats.totalOut += Math.abs(transaction.amount)
          stats.transfersOut++
          totalOut += Math.abs(transaction.amount)
        }

        stats.netBalance = stats.totalIn - stats.totalOut

        if (transaction.transfer_group_id) {
          stats.linkedCount++
          totalLinked++
        } else {
          stats.unlinkedCount++
          totalUnlinked++
        }
      })

      return {
        departmentStats,
        overallStats: {
          totalTransactions,
          totalLinked,
          totalUnlinked,
          totalIn,
          totalOut,
          netBalance: totalIn - totalOut
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
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
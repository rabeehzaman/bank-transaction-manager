import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Utility functions for data operations
export const transactionService = {
  // Fetch all transactions with their links and tags
  async getAllTransactionsWithMetadata(): Promise<EnhancedUnifiedTransaction[]> {
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

  // Update or create transaction department tag
  async updateTransactionDepartment(transactionId: string, department: string): Promise<void> {
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
    try {
      // Get existing data
      const { data: existing } = await supabase
        .from('transaction_tags')
        .select('*')
        .eq('transaction_id', transactionId)
        .single()

      const existingTags = existing?.tags || []
      let updatedTags = existingTags.filter((tag: string) => !tag.startsWith('category:'))
      
      if (category) {
        updatedTags.push(`category:${category}`)
      }

      const updateData: any = {
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
    try {
      const transferGroupId = crypto.randomUUID()
      
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
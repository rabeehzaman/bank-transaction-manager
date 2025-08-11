import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if both URL and key are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Updated type definitions for the new frontend system
export interface FrontendTransaction {
  Date: string
  Description: string
  'Cash In': number | null
  'Cash Out': number | null
  Bank: 'Ahli' | 'Rajhi' | 'GIB' | 'Riyad' | 'Alinma'
  department: string
  content_hash: string
  department_id: string | null
  net_amount: number
  'Sort Order': number
  manual_description?: string | null
}

export interface Department {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TransactionTag {
  id: string
  content_hash: string
  bank_name: string
  transaction_date: string
  description: string
  amount: number
  department_id: string | null
  notes: string | null
  confidence_level: number
  created_at: string
  updated_at: string
  created_by: string
}

// Pagination interface
export interface PaginationInfo {
  hasMore: boolean
  nextCursor?: string
  total?: number
}

export interface PaginatedFrontendTransactions {
  data: FrontendTransaction[]
  pagination: PaginationInfo
}

// New simplified transaction service using frontend_transactions_view
export const transactionService = {
  // Fetch all frontend transactions using the new view
  async getAllTransactions(): Promise<FrontendTransaction[]> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('frontend_transactions_view')
        .select('*')
        .order('Date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  },

  // Server-side pagination using frontend_transactions_view with simplified filtering
  async getTransactionsPaginated(
    limit = 50,
    cursor?: string,
    filters?: {
      bank?: string
      department?: string
      searchTerm?: string
      dateFrom?: string
      dateTo?: string
    }
  ): Promise<PaginatedFrontendTransactions> {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return { data: [], pagination: { hasMore: false } }
    }

    try {
      let query = supabase
        .from('frontend_transactions_view')
        .select('*')
        .order('Date', { ascending: false })
        .order('"Sort Order"', { ascending: false })

      // Apply cursor-based pagination
      if (cursor) {
        query = query.lt('Date', cursor)
      }

      // Apply server-side filters
      if (filters?.bank && filters.bank !== 'all') {
        query = query.eq('Bank', filters.bank)
      }

      if (filters?.department && filters.department !== 'all') {
        if (filters.department === 'Unassigned') {
          query = query.eq('department', 'Unassigned')
        } else {
          // Use case-insensitive matching and trim whitespace for more robust filtering
          query = query.ilike('department', filters.department)
        }
      }

      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.trim()
        
        // Check if the search term is numeric (for amount searching)
        const isNumericSearch = /^\d+\.?\d*$/.test(searchTerm)
        
        if (isNumericSearch) {
          const numericValue = parseFloat(searchTerm)
          // Search only in amount fields: net_amount, Cash In, or Cash Out
          query = query.or(`net_amount.eq.${numericValue},"Cash In".eq.${numericValue},"Cash Out".eq.${numericValue}`)
        } else {
          // Text search in description
          query = query.ilike('Description', `%${searchTerm}%`)
        }
      }

      // Apply date range filters
      if (filters?.dateFrom) {
        query = query.gte('Date', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('Date', filters.dateTo)
      }

      // Limit the results
      query = query.limit(limit + 1) // Get one extra to check if there are more results

      const result = await query

      if (result.error) throw result.error

      const data = result.data || []
      const hasMore = data.length > limit
      const transactions = hasMore ? data.slice(0, limit) : data

      const nextCursor = hasMore && transactions.length > 0 
        ? transactions[transactions.length - 1].Date 
        : undefined

      return {
        data: transactions,
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

  // Assign department to a transaction
  async assignDepartment(
    bankName: string,
    transactionDate: string,
    description: string,
    amount: number,
    departmentId: string,
    notes?: string
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase.rpc('assign_department_to_transaction', {
        p_bank_name: bankName,
        p_transaction_date: transactionDate,
        p_description: description,
        p_amount: amount,
        p_department_id: departmentId,
        p_notes: notes || null,
        p_created_by: 'user'
      })

      if (error) throw error
    } catch (error) {
      console.error('Error assigning department:', error)
      throw error
    }
  },

  // Remove department assignment from a transaction
  async removeDepartment(contentHash: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase.rpc('remove_department_assignment', {
        p_content_hash: contentHash
      })

      if (error) throw error
    } catch (error) {
      console.error('Error removing department:', error)
      throw error
    }
  },

  // Bulk assign department to multiple transactions
  async bulkAssignDepartment(
    contentHashes: string[],
    departmentId: string,
    notes?: string
  ): Promise<number> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase.rpc('bulk_assign_department', {
        p_content_hashes: contentHashes,
        p_department_id: departmentId,
        p_notes: notes || null,
        p_created_by: 'user'
      })

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('Error bulk assigning departments:', error)
      throw error
    }
  },

  // Update manual description for a transaction
  async updateManualDescription(
    contentHash: string,
    manualDescription: string | null
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase.rpc('update_manual_description', {
        p_content_hash: contentHash,
        p_manual_description: manualDescription
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating manual description:', error)
      throw error
    }
  }
}

// Department service
export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching departments:', error)
      throw error
    }
    
    return data || []
  },

  async createDepartment(name: string, description?: string): Promise<Department> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('departments')
      .insert({ name, description })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteDepartment(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase
      .from('departments')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) throw error
  },

  async getDepartmentStats(): Promise<Record<string, number>> {
    if (!supabase) return {}
    
    try {
      const { data: transactions } = await supabase
        .from('frontend_transactions_view')
        .select('department')
      
      const stats: Record<string, number> = {}
      
      if (transactions) {
        transactions.forEach(t => {
          const dept = t.department || 'Unassigned'
          stats[dept] = (stats[dept] || 0) + 1
        })
      }
      
      return stats
    } catch (error) {
      console.error('Error fetching department stats:', error)
      return {}
    }
  }
}
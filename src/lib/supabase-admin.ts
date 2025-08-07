import { supabase, Department } from './supabase'

export interface DepartmentRule {
  id: string
  department_id: string
  rule_name: string
  rule_type: 'keyword' | 'amount_range' | 'bank_specific' | 'reference_pattern' | 'date_based'
  conditions: Record<string, unknown>
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
  department?: Department
}

export interface RuleApplicationLog {
  id: string
  rule_id: string | null
  transaction_count: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
}

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('departments')
      .select('*')
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
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getDepartmentStats(): Promise<Record<string, number>> {
    if (!supabase) return {}
    
    try {
      const { data: tags } = await supabase
        .from('transaction_tags')
        .select('source_department')
      
      const stats: Record<string, number> = {}
      
      if (tags) {
        tags.forEach(tag => {
          const dept = tag.source_department || 'Unassigned'
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

// Auto-sync configuration interfaces
export interface AutoSyncConfig {
  id: string
  enabled: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface AutoSyncStats {
  total_applications: number
  successful_applications: number
  failed_applications: number
  last_application: string | null
  most_used_rule: string | null
}

export interface AutoSyncLog {
  id: string
  transaction_hash: string
  rule_id: string | null
  rule_name: string | null
  department_id: string | null
  department_name: string | null
  applied_at: string
  success: boolean
  error_message: string | null
}

// Auto-sync service
export const autoSyncService = {
  async getConfig(): Promise<AutoSyncConfig | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('auto_sync_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        // Don't log error for missing table - this is expected before migration
        if (error.code !== 'PGRST116' && !error.message.includes('relation "auto_sync_config" does not exist')) {
          console.error('Error fetching auto-sync config:', error)
        }
        return null
      }
      
      return data
    } catch {
      // Suppress errors for missing tables
      return null
    }
  },

  async enableAutoSync(): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { error } = await supabase.rpc('enable_auto_sync')
      
      if (error) {
        console.error('Error enabling auto-sync:', error)
        return false
      }
      
      return true
    } catch {
      return false
    }
  },

  async disableAutoSync(): Promise<boolean> {
    if (!supabase) return false
    
    try {
      const { error } = await supabase.rpc('disable_auto_sync')
      
      if (error) {
        console.error('Error disabling auto-sync:', error)
        return false
      }
      
      return true
    } catch {
      return false
    }
  },

  async getStats(): Promise<AutoSyncStats | null> {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase.rpc('get_auto_sync_stats')
      
      if (error) {
        // Don't log error for missing function - this is expected before migration
        if (!error.message.includes('function get_auto_sync_stats() does not exist')) {
          console.error('Error fetching auto-sync stats:', error)
        }
        return null
      }
      
      return data?.[0] || null
    } catch {
      return null
    }
  },

  async getLogs(limit: number = 50): Promise<AutoSyncLog[]> {
    if (!supabase) return []
    
    try {
      const { data, error } = await supabase
        .from('auto_sync_log')
        .select('*')
        .order('applied_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        // Don't log error for missing table - this is expected before migration
        if (!error.message.includes('relation "auto_sync_log" does not exist')) {
          console.error('Error fetching auto-sync logs:', error)
        }
        return []
      }
      
      return data || []
    } catch {
      return []
    }
  }
}

export const ruleService = {
  async getAllRules(): Promise<DepartmentRule[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('department_rules')
      .select(`
        *,
        department:departments(*)
      `)
      .order('priority', { ascending: false })
    
    if (error) {
      console.error('Error fetching rules:', error)
      throw error
    }
    
    return data || []
  },

  async createRule(rule: Omit<DepartmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<DepartmentRule> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('department_rules')
      .insert(rule)
      .select(`
        *,
        department:departments(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async updateRule(id: string, updates: Partial<DepartmentRule>): Promise<DepartmentRule> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('department_rules')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        department:departments(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async deleteRule(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase
      .from('department_rules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async testRule(rule: DepartmentRule, transactionSample: Record<string, unknown>): Promise<boolean> {
    // Implementation of rule testing logic
    try {
      switch (rule.rule_type) {
        case 'keyword':
          const keywords = rule.conditions.keywords as string[]
          if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return false
          }
          // Match transaction field names from FrontendTransaction interface
          const searchText = `${transactionSample.Description || ''} ${transactionSample.reference || ''}`.toLowerCase()
          return keywords.some(keyword => keyword && searchText.includes(keyword.toLowerCase()))
        
        case 'amount_range':
          const { min, max } = rule.conditions
          if (typeof min !== 'number' || typeof max !== 'number') {
            return false
          }
          // Use net_amount which is the actual field in FrontendTransaction
          const amount = Math.abs(transactionSample.net_amount as number)
          if (isNaN(amount)) {
            return false
          }
          return amount >= min && amount <= max
        
        case 'bank_specific':
          const bankName = rule.conditions.bank_name as string
          if (!bankName) {
            return false
          }
          // Match Bank field from FrontendTransaction interface
          return transactionSample.Bank === bankName
        
        case 'reference_pattern':
          const patternStr = rule.conditions.pattern as string
          if (!patternStr) {
            return false
          }
          try {
            const pattern = new RegExp(patternStr, 'i')
            // Check both Description and other potential reference fields
            const referenceText = (transactionSample.Description as string) || (transactionSample.reference as string) || ''
            return pattern.test(referenceText)
          } catch {
            return false
          }
        
        case 'date_based':
          // Implement date-based logic using Date field from FrontendTransaction
          const dateConditions = rule.conditions as { start_date?: string; end_date?: string; days_of_week?: number[] }
          const transactionDate = new Date(transactionSample.Date as string)
          
          if (dateConditions.start_date && new Date(dateConditions.start_date) > transactionDate) {
            return false
          }
          if (dateConditions.end_date && new Date(dateConditions.end_date) < transactionDate) {
            return false
          }
          if (dateConditions.days_of_week && !dateConditions.days_of_week.includes(transactionDate.getDay())) {
            return false
          }
          
          return true
        
        default:
          return false
      }
    } catch (error) {
      console.error('Error testing rule:', error)
      return false
    }
  }
}
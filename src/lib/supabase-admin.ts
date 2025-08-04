import { supabase } from './supabase'

export interface Department {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

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
          const searchText = `${transactionSample.description || ''} ${transactionSample.reference || ''}`.toLowerCase()
          return keywords.some(keyword => keyword && searchText.includes(keyword.toLowerCase()))
        
        case 'amount_range':
          const { min, max } = rule.conditions
          if (typeof min !== 'number' || typeof max !== 'number') {
            return false
          }
          const amount = Math.abs(transactionSample.amount as number)
          if (isNaN(amount)) {
            return false
          }
          return amount >= min && amount <= max
        
        case 'bank_specific':
          const bankName = rule.conditions.bank_name as string
          if (!bankName) {
            return false
          }
          return transactionSample.bank_name === bankName
        
        case 'reference_pattern':
          const patternStr = rule.conditions.pattern as string
          if (!patternStr) {
            return false
          }
          try {
            const pattern = new RegExp(patternStr, 'i')
            return pattern.test((transactionSample.reference as string) || '')
          } catch {
            return false
          }
        
        case 'date_based':
          // Implement date-based logic
          return false
        
        default:
          return false
      }
    } catch (error) {
      console.error('Error testing rule:', error)
      return false
    }
  }
}
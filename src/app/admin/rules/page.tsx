'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { departmentService, ruleService, Department, DepartmentRule } from '@/lib/supabase-admin'

export default function AdminRulesPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [rules, setRules] = useState<DepartmentRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<DepartmentRule | null>(null)
  const [formData, setFormData] = useState({
    rule_name: '',
    department_id: '',
    rule_type: 'keyword' as DepartmentRule['rule_type'],
    conditions: {} as Record<string, unknown>,
    priority: 100
  })
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [departmentsData, rulesData] = await Promise.all([
        departmentService.getAllDepartments(),
        ruleService.getAllRules()
      ])
      setDepartments(departmentsData)
      setRules(rulesData)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const ruleData = {
        ...formData,
        is_active: true
      }

      if (editingRule) {
        await ruleService.updateRule(editingRule.id, ruleData)
        toast.success('Rule updated successfully')
      } else {
        await ruleService.createRule(ruleData)
        toast.success('Rule created successfully')
      }
      
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save rule'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (rule: DepartmentRule) => {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      department_id: rule.department_id,
      rule_type: rule.rule_type,
      conditions: rule.conditions,
      priority: rule.priority
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return
    }

    setDeleting(id)
    try {
      await ruleService.deleteRule(id)
      toast.success('Rule deleted successfully')
      loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete rule'
      toast.error(errorMessage)
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setEditingRule(null)
    setFormData({
      rule_name: '',
      department_id: '',
      rule_type: 'keyword',
      conditions: {},
      priority: 100
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const updateConditions = (key: string, value: unknown) => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        [key]: value
      }
    })
  }

  const renderConditionInputs = () => {
    switch (formData.rule_type) {
      case 'keyword':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Keywords (comma-separated)</label>
            <Input
              value={Array.isArray(formData.conditions.keywords) ? (formData.conditions.keywords as string[]).join(', ') : ''}
              onChange={(e) => updateConditions('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
              placeholder="e.g., grocery, food, market"
            />
          </div>
        )
      
      case 'amount_range':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Amount</label>
              <Input
                type="number"
                value={typeof formData.conditions.min === 'number' ? formData.conditions.min.toString() : ''}
                onChange={(e) => updateConditions('min', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Amount</label>
              <Input
                type="number"
                value={typeof formData.conditions.max === 'number' ? formData.conditions.max.toString() : ''}
                onChange={(e) => updateConditions('max', parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
          </div>
        )
      
      case 'bank_specific':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank Name</label>
            <Select
              value={typeof formData.conditions.bank_name === 'string' ? formData.conditions.bank_name : ''}
              onValueChange={(value) => updateConditions('bank_name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ahli">Ahli</SelectItem>
                <SelectItem value="Rajhi">Rajhi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'reference_pattern':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Pattern (regex)</label>
            <Input
              value={typeof formData.conditions.pattern === 'string' ? formData.conditions.pattern : ''}
              onChange={(e) => updateConditions('pattern', e.target.value)}
              placeholder="e.g., ^TRF.*"
            />
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">Loading rules...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rule Management
              </CardTitle>
              <CardDescription>
                Create rules to automatically assign departments to transactions
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.rule_name}</TableCell>
                  <TableCell>
                    {rule.department?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.rule_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleting === rule.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription>
              Define conditions to automatically assign departments to transactions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="e.g., Grocery Store Keywords"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rule Type</label>
              <Select
                value={formData.rule_type}
                onValueChange={(value: DepartmentRule['rule_type']) => 
                  setFormData({ ...formData, rule_type: value, conditions: {} })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword Match</SelectItem>
                  <SelectItem value="amount_range">Amount Range</SelectItem>
                  <SelectItem value="bank_specific">Bank Specific</SelectItem>
                  <SelectItem value="reference_pattern">Reference Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderConditionInputs()}

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Higher priority rules are applied first
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.rule_name.trim() || !formData.department_id}
            >
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
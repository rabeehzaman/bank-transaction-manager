'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { departmentService, Department } from '@/lib/supabase-admin'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentStats, setDepartmentStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadDepartments()
    loadDepartmentStats()
  }, [])

  const loadDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments()
      setDepartments(data)
    } catch {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartmentStats = async () => {
    try {
      const stats = await departmentService.getDepartmentStats()
      setDepartmentStats(stats)
    } catch (error) {
      console.error('Failed to load department stats:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment.id, {
          name: formData.name,
          description: formData.description
        })
        toast.success('Department updated successfully')
      } else {
        await departmentService.createDepartment(formData.name, formData.description)
        toast.success('Department created successfully')
      }
      
      setDialogOpen(false)
      setEditingDepartment(null)
      setFormData({ name: '', description: '' })
      loadDepartments()
      loadDepartmentStats()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save department'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({ name: department.name, description: department.description || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? All associated rules will be deleted.')) {
      return
    }

    setDeleting(id)
    try {
      await departmentService.deleteDepartment(id)
      toast.success('Department deleted successfully')
      loadDepartments()
      loadDepartmentStats()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete department'
      toast.error(errorMessage)
    } finally {
      setDeleting(null)
    }
  }

  const openCreateDialog = () => {
    setEditingDepartment(null)
    setFormData({ name: '', description: '' })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">Loading departments...</div>
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
                <Building2 className="w-5 h-5" />
                Department Management
              </CardTitle>
              <CardDescription>
                Create, edit, and manage transaction departments
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {department.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {departmentStats[department.name] || 0} transactions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={department.is_active ? 'default' : 'secondary'}>
                      {department.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(department)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(department.id)}
                        disabled={deleting === department.id}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Create New Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment 
                ? 'Update the department details below.'
                : 'Add a new department for categorizing transactions.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electronics"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Electronic goods and accessories"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
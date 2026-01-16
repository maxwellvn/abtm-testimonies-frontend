"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getAdminTestimonyCategories, createTestimonyCategory, updateTestimonyCategory, deleteTestimonyCategory } from '@/lib/api'
import type { TestimonyCategory } from '@/types'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type TestimonyCategoryWithCount = TestimonyCategory & { _count: { testimonies: number } }

export default function TestimonyCategoriesPage() {
  const [categories, setCategories] = useState<TestimonyCategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TestimonyCategoryWithCount | null>(null)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { toast } = useToast()

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAdminTestimonyCategories()
      setCategories(result.categories)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load testimony categories',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await createTestimonyCategory(name.trim())
      toast({
        title: 'Success',
        description: 'Testimony category created successfully',
        variant: 'success',
      })
      setIsCreateOpen(false)
      setName('')
      loadCategories()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create category',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory || !name.trim()) return

    setIsSaving(true)
    try {
      await updateTestimonyCategory(selectedCategory.id, { name: name.trim() })
      toast({
        title: 'Success',
        description: 'Testimony category updated successfully',
        variant: 'success',
      })
      setIsEditOpen(false)
      setSelectedCategory(null)
      setName('')
      loadCategories()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (category: TestimonyCategoryWithCount) => {
    try {
      await updateTestimonyCategory(category.id, { isActive: !category.isActive })
      toast({
        title: 'Success',
        description: `Category ${category.isActive ? 'deactivated' : 'activated'}`,
      })
      loadCategories()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setIsDeleting(id)
    try {
      await deleteTestimonyCategory(id)
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })
      loadCategories()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete category',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const openEdit = (category: TestimonyCategoryWithCount) => {
    setSelectedCategory(category)
    setName(category.name)
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimony Types</h1>
          <p className="text-gray-500">Manage testimony categories (Healing, Divine Intervention, etc.)</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setName('')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Testimony Category</DialogTitle>
              <DialogDescription>
                Add a new testimony category for users to select
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Healing, Financial Breakthrough"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !name.trim()}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Categories</CardTitle>
          <CardDescription>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories found</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category.name}</span>
                    {!category.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {category._count.testimonies} testimonies
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(category)}
                    >
                      {category.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      disabled={isDeleting === category.id}
                    >
                      {isDeleting === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-name">Category Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving || !name.trim()}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

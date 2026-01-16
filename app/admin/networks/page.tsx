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
import { getAdminNetworks, createNetwork, updateNetwork, deleteNetwork } from '@/lib/api'
import type { Network } from '@/types'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { toast } = useToast()

  const loadNetworks = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAdminNetworks()
      setNetworks(result.networks)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load networks',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadNetworks()
  }, [loadNetworks])

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await createNetwork(name.trim())
      toast({
        title: 'Success',
        description: 'Network created successfully',
        variant: 'success',
      })
      setIsCreateOpen(false)
      setName('')
      loadNetworks()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create network',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedNetwork || !name.trim()) return

    setIsSaving(true)
    try {
      await updateNetwork(selectedNetwork.id, { name: name.trim() })
      toast({
        title: 'Success',
        description: 'Network updated successfully',
        variant: 'success',
      })
      setIsEditOpen(false)
      setSelectedNetwork(null)
      setName('')
      loadNetworks()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update network',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (network: Network) => {
    try {
      await updateNetwork(network.id, { isActive: !network.isActive })
      toast({
        title: 'Success',
        description: `Network ${network.isActive ? 'deactivated' : 'activated'}`,
      })
      loadNetworks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update network',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this network?')) return

    setIsDeleting(id)
    try {
      await deleteNetwork(id)
      toast({
        title: 'Success',
        description: 'Network deleted successfully',
      })
      loadNetworks()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete network',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const openEdit = (network: Network) => {
    setSelectedNetwork(network)
    setName(network.name)
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Networks</h1>
          <p className="text-gray-500">Manage testimony networks</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setName('')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Network</DialogTitle>
              <DialogDescription>
                Add a new network for testimony categorization
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name">Network Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter network name"
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
          <CardTitle className="text-lg">All Networks</CardTitle>
          <CardDescription>
            {networks.length} network{networks.length !== 1 ? 's' : ''} total
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
          ) : networks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No networks found</p>
          ) : (
            <div className="space-y-3">
              {networks.map((network) => (
                <div
                  key={network.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{network.name}</span>
                    {network.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    {!network.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(network)}
                    >
                      {network.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(network)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!network.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(network.id)}
                        disabled={isDeleting === network.id}
                      >
                        {isDeleting === network.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
            <DialogTitle>Edit Network</DialogTitle>
            <DialogDescription>
              Update the network name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-name">Network Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter network name"
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

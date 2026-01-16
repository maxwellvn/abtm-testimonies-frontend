"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getTestimonies, getTestimony, updateTestimonyStatus, deleteTestimony, getTestimonyCategories, getCountries, getZones } from '@/lib/api'
import type { Testimony, PaginatedResponse, TestimonyCategory, Country, Region, Zone } from '@/types'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Video,
  Mic,
  Loader2,
} from 'lucide-react'

export default function TestimoniesPage() {
  const [data, setData] = useState<PaginatedResponse<Testimony> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [testimonyCategories, setTestimonyCategories] = useState<TestimonyCategory[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])

  // Extract all zones from regions for the filter dropdown
  const allZones = useMemo(() => {
    return regions.flatMap(region => region.zones)
  }, [regions])

  // Filters
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [categoryType, setCategoryType] = useState<string>('')
  const [contentType, setContentType] = useState<string>('')
  const [testimonyCategoryId, setTestimonyCategoryId] = useState<string>('')
  const [countryId, setCountryId] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { toast } = useToast()

  // Load filter data on mount
  useEffect(() => {
    Promise.all([
      getTestimonyCategories().then(setTestimonyCategories),
      getCountries().then(setCountries),
      getZones().then(setRegions),
    ]).catch(console.error)
  }, [])

  // Build full media URL (backend returns relative path like /api/media/...)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
  const getMediaUrl = useCallback((url: string | null | undefined) => {
    if (!url) return null
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    // Prepend API URL for relative paths
    return `${API_URL}${url}`
  }, [API_URL])

  const loadTestimonies = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTestimonies({
        page,
        limit: 10,
        status: status || undefined,
        categoryType: categoryType || undefined,
        contentType: contentType || undefined,
        testimonyCategoryId: testimonyCategoryId || undefined,
        countryId: countryId || undefined,
        zoneId: zoneId || undefined,
        search: search || undefined,
      })
      setData(result)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load testimonies',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, status, categoryType, contentType, testimonyCategoryId, countryId, zoneId, search, toast])

  useEffect(() => {
    loadTestimonies()
  }, [loadTestimonies])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const handleViewTestimony = async (id: string) => {
    try {
      const result = await getTestimony(id)
      setSelectedTestimony(result.testimony)
      setIsViewOpen(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load testimony details',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setIsUpdating(true)
    try {
      await updateTestimonyStatus(id, newStatus)
      toast({
        title: 'Success',
        description: `Testimony ${newStatus.toLowerCase()}`,
        variant: 'success',
      })
      setIsViewOpen(false)
      loadTestimonies()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update testimony',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimony?')) return

    setIsDeleting(true)
    try {
      await deleteTestimony(id)
      toast({
        title: 'Success',
        description: 'Testimony deleted',
      })
      setIsViewOpen(false)
      loadTestimonies()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete testimony',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />
      case 'AUDIO':
        return <Mic className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="warning">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Testimonies</h1>
        <p className="text-gray-500">Manage and review submitted testimonies</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, church..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryType} onValueChange={(v) => { setCategoryType(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="NETWORK">Network</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                  <SelectItem value="REGION">Region</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentType} onValueChange={(v) => { setContentType(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="AUDIO">Audio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={testimonyCategoryId} onValueChange={(v) => { setTestimonyCategoryId(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Testimony Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {testimonyCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={countryId} onValueChange={(v) => { setCountryId(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={zoneId} onValueChange={(v) => { setZoneId(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {allZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonies List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {data ? `${data.pagination.total} Testimonies` : 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : !data || data.testimonies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No testimonies found</p>
          ) : (
            <div className="space-y-3">
              {data.testimonies.map((testimony) => (
                <div
                  key={testimony.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                      {getContentIcon(testimony.contentType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{testimony.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {testimony.email} · {testimony.church}
                      </p>
                      <p className="text-xs text-gray-400">
                        {testimony.testimonyCategory?.name && <span className="text-blue-600">{testimony.testimonyCategory.name}</span>}
                        {testimony.testimonyCategory?.name && ' · '}
                        {testimony.categoryType} · {testimony.country?.name} · {new Date(testimony.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(testimony.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewTestimony(testimony.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Testimony Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTestimony && (
            <>
              <DialogHeader>
                <DialogTitle>Testimony Details</DialogTitle>
                <DialogDescription>
                  Submitted on {new Date(selectedTestimony.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status</span>
                  {getStatusBadge(selectedTestimony.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Name</span>
                    <p className="font-medium">{selectedTestimony.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-medium">{selectedTestimony.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone</span>
                    <p className="font-medium">{selectedTestimony.phoneCountryCode} {selectedTestimony.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Country</span>
                    <p className="font-medium">{selectedTestimony.country.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Church</span>
                    <p className="font-medium">{selectedTestimony.church}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Zone</span>
                    <p className="font-medium">{selectedTestimony.zone?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Testimony Type</span>
                    <p className="font-medium text-blue-600">{selectedTestimony.testimonyCategory?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Submission Category</span>
                    <p className="font-medium">
                      {selectedTestimony.categoryType}
                      {selectedTestimony.network && ` - ${selectedTestimony.network.name}`}
                      {selectedTestimony.externalCategory && ` - ${selectedTestimony.externalCategory.name}`}
                      {selectedTestimony.customNetwork && ` - ${selectedTestimony.customNetwork}`}
                      {selectedTestimony.customExternal && ` - ${selectedTestimony.customExternal}`}
                    </p>
                  </div>
                </div>

                {selectedTestimony.kingschatUsername && (
                  <div>
                    <span className="text-sm text-gray-500">KingsChat</span>
                    <p className="font-medium">{selectedTestimony.kingschatUsername}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-500">Testimony Content ({selectedTestimony.contentType})</span>
                  {selectedTestimony.contentType === 'TEXT' ? (
                    <p className="mt-2 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedTestimony.textContent}
                    </p>
                  ) : selectedTestimony.mediaUrl ? (
                    <div className="mt-2">
                      {selectedTestimony.contentType === 'VIDEO' ? (
                        <video
                          src={getMediaUrl(selectedTestimony.mediaUrl) || ''}
                          controls
                          className="w-full rounded-lg"
                          crossOrigin="use-credentials"
                        />
                      ) : (
                        <audio
                          src={getMediaUrl(selectedTestimony.mediaUrl) || ''}
                          controls
                          className="w-full"
                          crossOrigin="use-credentials"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-gray-500">Media not available</p>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedTestimony.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
                <div className="flex gap-2">
                  {selectedTestimony.status !== 'REJECTED' && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedTestimony.id, 'REJECTED')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  )}
                  {selectedTestimony.status !== 'APPROVED' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedTestimony.id, 'APPROVED')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

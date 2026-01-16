"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { getStorageSettings, updateStorageSettings } from '@/lib/api'
import type { StorageSettingsResponse } from '@/types'
import { HardDrive, Video, Mic, Save, Loader2, RefreshCw } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function parseSize(value: string, unit: string): number {
  const num = parseFloat(value) || 0
  const multipliers: Record<string, number> = {
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  }
  return Math.round(num * (multipliers[unit] || 1))
}

function bytesToUnit(bytes: number, unit: string): string {
  const divisors: Record<string, number> = {
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  }
  return (bytes / (divisors[unit] || 1)).toFixed(0)
}

export default function SettingsPage() {
  const [data, setData] = useState<StorageSettingsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [totalStorageGB, setTotalStorageGB] = useState('')
  const [maxVideoMB, setMaxVideoMB] = useState('')
  const [maxAudioMB, setMaxAudioMB] = useState('')

  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getStorageSettings()
      setData(result)
      setTotalStorageGB(bytesToUnit(result.settings.totalStorageLimit, 'GB'))
      setMaxVideoMB(bytesToUnit(result.settings.maxVideoFileSize, 'MB'))
      setMaxAudioMB(bytesToUnit(result.settings.maxAudioFileSize, 'MB'))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load storage settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    const totalStorageLimit = parseSize(totalStorageGB, 'GB')
    const maxVideoFileSize = parseSize(maxVideoMB, 'MB')
    const maxAudioFileSize = parseSize(maxAudioMB, 'MB')

    if (totalStorageLimit < 100 * 1024 * 1024) {
      toast({
        title: 'Validation Error',
        description: 'Total storage limit must be at least 100 MB',
        variant: 'destructive',
      })
      return
    }

    if (maxVideoFileSize < 1024 * 1024) {
      toast({
        title: 'Validation Error',
        description: 'Max video file size must be at least 1 MB',
        variant: 'destructive',
      })
      return
    }

    if (maxAudioFileSize < 1024 * 1024) {
      toast({
        title: 'Validation Error',
        description: 'Max audio file size must be at least 1 MB',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await updateStorageSettings({
        totalStorageLimit,
        maxVideoFileSize,
        maxAudioFileSize,
      })
      setData(result)
      toast({
        title: 'Success',
        description: 'Storage settings updated successfully',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage storage and system settings</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage storage and system settings</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Failed to load settings</p>
            <Button variant="outline" className="mt-4" onClick={loadSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { settings, stats } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage storage and system settings</p>
        </div>
        <Button onClick={loadSettings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Storage Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>Current storage consumption</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {formatBytes(stats.totalUsed)} of {formatBytes(stats.totalLimit)} used
              </span>
              <span className="text-sm text-gray-500">{stats.usagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={stats.usagePercent} className="h-3" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Videos</p>
                  <p className="text-sm text-gray-500">{stats.videos.count} files</p>
                </div>
              </div>
              <span className="font-semibold">{formatBytes(stats.videos.size)}</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Audio</p>
                  <p className="text-sm text-gray-500">{stats.audios.count} files</p>
                </div>
              </div>
              <span className="font-semibold">{formatBytes(stats.audios.size)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Limits Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage Limits</CardTitle>
          <CardDescription>Configure maximum storage and file size limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="totalStorage">Total Storage Limit (GB)</Label>
              <Input
                id="totalStorage"
                type="number"
                min="1"
                value={totalStorageGB}
                onChange={(e) => setTotalStorageGB(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-gray-500">
                Current: {formatBytes(settings.totalStorageLimit)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxVideo">Max Video File Size (MB)</Label>
              <Input
                id="maxVideo"
                type="number"
                min="1"
                value={maxVideoMB}
                onChange={(e) => setMaxVideoMB(e.target.value)}
                placeholder="e.g. 100"
              />
              <p className="text-xs text-gray-500">
                Current: {formatBytes(settings.maxVideoFileSize)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAudio">Max Audio File Size (MB)</Label>
              <Input
                id="maxAudio"
                type="number"
                min="1"
                value={maxAudioMB}
                onChange={(e) => setMaxAudioMB(e.target.value)}
                placeholder="e.g. 20"
              />
              <p className="text-xs text-gray-500">
                Current: {formatBytes(settings.maxAudioFileSize)}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

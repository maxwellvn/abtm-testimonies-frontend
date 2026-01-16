"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getStats } from '@/lib/api'
import type { StatsResponse } from '@/types'
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Video,
  Mic,
  Network,
  FolderOpen,
  MapPin,
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Overview of your testimony platform</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load statistics</p>
      </div>
    )
  }

  const statusCards = [
    {
      label: 'Total Testimonies',
      value: stats.stats.total,
      icon: MessageSquare,
      color: 'text-gray-900',
    },
    {
      label: 'Pending Review',
      value: stats.stats.byStatus.pending,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Approved',
      value: stats.stats.byStatus.approved,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Rejected',
      value: stats.stats.byStatus.rejected,
      icon: XCircle,
      color: 'text-red-600',
    },
  ]

  const contentTypeCards = [
    { label: 'Text', value: stats.stats.byContentType.text, icon: FileText },
    { label: 'Video', value: stats.stats.byContentType.video, icon: Video },
    { label: 'Audio', value: stats.stats.byContentType.audio, icon: Mic },
  ]

  const categoryTypeCards = [
    { label: 'Network', value: stats.stats.byCategoryType.network, icon: Network },
    { label: 'External', value: stats.stats.byCategoryType.external, icon: FolderOpen },
    { label: 'Region', value: stats.stats.byCategoryType.region, icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your testimony platform</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.label}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Content Type</CardTitle>
            <CardDescription>Breakdown of testimony formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentTypeCards.map((card) => (
                <div key={card.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <card.icon className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{card.label}</span>
                  </div>
                  <span className="text-lg font-semibold">{card.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Category Type</CardTitle>
            <CardDescription>How testimonies are categorized</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryTypeCards.map((card) => (
                <div key={card.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <card.icon className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{card.label}</span>
                  </div>
                  <span className="text-lg font-semibold">{card.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Testimonies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Testimonies</CardTitle>
          <CardDescription>Latest submissions to review</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentTestimonies.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No testimonies yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTestimonies.map((testimony) => (
                <Link
                  key={testimony.id}
                  href="/admin/testimonies"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{testimony.name}</p>
                      <p className="text-sm text-gray-500">
                        {testimony.categoryType} · {testimony.contentType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        testimony.status === 'APPROVED'
                          ? 'success'
                          : testimony.status === 'REJECTED'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {testimony.status.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(testimony.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

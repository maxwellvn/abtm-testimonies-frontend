export type CategoryType = 'NETWORK' | 'EXTERNAL' | 'REGION'
export type ContentType = 'TEXT' | 'VIDEO' | 'AUDIO'
export type TestimonyStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Admin {
  id: string
  email: string
  name: string
}

export interface Network {
  id: string
  name: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ExternalCategory {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TestimonyCategory {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Region {
  id: string
  name: string
  zones: Zone[]
}

export interface Zone {
  id: string
  name: string
  regionId: string
  groups: Group[]
}

export interface Group {
  id: string
  name: string
  zoneId: string
  isCustom: boolean
}

export interface Country {
  id: string
  name: string
  code: string
  phoneCode: string
}

export interface Testimony {
  id: string
  testimonyCategoryId: string
  testimonyCategory: { id: string; name: string }
  categoryType: CategoryType
  networkId: string | null
  network: { id: string; name: string } | null
  customNetwork: string | null
  externalCategoryId: string | null
  externalCategory: { id: string; name: string } | null
  customExternal: string | null
  zoneId: string | null
  zone: { id: string; name: string } | null
  groupId: string | null
  group: { id: string; name: string } | null
  name: string
  email: string
  phone: string
  phoneCountryCode: string
  countryId: string
  country: { id: string; name: string; code: string }
  userZoneId: string | null
  userGroupId: string | null
  church: string | null
  kingschatUsername: string | null
  contentType: ContentType
  textContent: string | null
  mediaUrl: string | null
  mediaMimeType: string | null
  mediaSize: number | null
  status: TestimonyStatus
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface TestimonyInput {
  testimonyCategoryId: string
  categoryType: CategoryType
  networkId?: string
  customNetwork?: string
  externalCategoryId?: string
  customExternal?: string
  zoneId?: string
  groupId?: string
  name: string
  email: string
  phone: string
  phoneCountryCode: string
  countryId: string
  userZoneId?: string
  userGroupId?: string
  church?: string
  kingschatUsername?: string
  contentType: ContentType
  textContent?: string
}

export interface PaginatedResponse<T> {
  testimonies: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Stats {
  total: number
  byStatus: {
    pending: number
    approved: number
    rejected: number
  }
  byContentType: {
    text: number
    video: number
    audio: number
  }
  byCategoryType: {
    network: number
    external: number
    region: number
  }
  topCountries: { country: string; count: number }[]
  topZones: { zone: string; count: number }[]
  topTestimonyTypes: { type: string; count: number }[]
}

export interface RecentTestimony {
  id: string
  name: string
  categoryType: CategoryType
  contentType: ContentType
  status: TestimonyStatus
  createdAt: string
  testimonyCategory?: { name: string }
}

export interface StatsResponse {
  stats: Stats
  recentTestimonies: RecentTestimony[]
}

export interface LoginResponse {
  success: boolean
  admin: Admin
  token: string
}

export interface StorageSettings {
  totalStorageLimit: number
  maxVideoFileSize: number
  maxAudioFileSize: number
}

export interface StorageStats {
  totalUsed: number
  totalLimit: number
  usagePercent: number
  videos: {
    count: number
    size: number
  }
  audios: {
    count: number
    size: number
  }
}

export interface StorageSettingsResponse {
  settings: StorageSettings
  stats: StorageStats
}

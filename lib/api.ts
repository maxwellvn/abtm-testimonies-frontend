import type {
  Network,
  ExternalCategory,
  TestimonyCategory,
  Region,
  Country,
  Testimony,
  PaginatedResponse,
  StatsResponse,
  LoginResponse,
  TestimonyInput,
  Group,
  StorageSettingsResponse,
  StorageSettings,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Public endpoints
export async function getNetworks(): Promise<Network[]> {
  const data = await fetchApi<{ networks: Network[] }>('/api/networks')
  return data.networks
}

export async function getExternalCategories(): Promise<ExternalCategory[]> {
  const data = await fetchApi<{ categories: ExternalCategory[] }>('/api/external')
  return data.categories
}

export async function getTestimonyCategories(): Promise<TestimonyCategory[]> {
  const data = await fetchApi<{ categories: TestimonyCategory[] }>('/api/testimony-categories')
  return data.categories
}

export async function getZones(): Promise<Region[]> {
  const data = await fetchApi<{ regions: Region[] }>('/api/zones')
  return data.regions
}

export async function getCountries(): Promise<Country[]> {
  const data = await fetchApi<{ countries: Country[] }>('/api/countries')
  return data.countries
}

export async function getGroups(zoneId: string): Promise<Group[]> {
  const data = await fetchApi<{ groups: Group[] }>(`/api/groups?zoneId=${zoneId}`)
  return data.groups
}

export async function createGroup(data: { name: string; zoneId: string }): Promise<Group> {
  const response = await fetchApi<{ group: Group }>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.group
}

export async function submitTestimony(
  data: TestimonyInput,
  file?: File
): Promise<{ success: boolean; testimony: { id: string } }> {
  const formData = new FormData()
  formData.append('data', JSON.stringify(data))
  if (file) {
    formData.append('file', file)
  }

  try {
    const controller = new AbortController()
    // 5 minute timeout for large file uploads
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    const response = await fetch(`${API_URL}/api/testimonies`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Submission failed' }))

      // Format detailed validation errors if available
      if (errorData.details && Array.isArray(errorData.details)) {
        const messages = errorData.details.map((d: { path?: string[]; message?: string }) => {
          const field = d.path?.join('.') || 'Field'
          return `${field}: ${d.message}`
        }).join('\n')
        throw new Error(messages || errorData.error || 'Validation failed')
      }

      throw new Error(errorData.error || `Submission failed (${response.status})`)
    }

    return response.json()
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Upload timed out. Please try a smaller file or check your connection.')
      }
      throw err
    }
    throw new Error('Submission failed')
  }
}

// Auth endpoints
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<void> {
  await fetchApi('/api/auth/logout', { method: 'POST' })
}

export async function getCurrentAdmin(): Promise<{ admin: { id: string; email: string; name: string } }> {
  return fetchApi('/api/auth/me')
}

// Admin endpoints
export async function getTestimonies(params: {
  page?: number
  limit?: number
  status?: string
  categoryType?: string
  contentType?: string
  testimonyCategoryId?: string
  countryId?: string
  zoneId?: string
  search?: string
}): Promise<PaginatedResponse<Testimony>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.status) searchParams.set('status', params.status)
  if (params.categoryType) searchParams.set('categoryType', params.categoryType)
  if (params.contentType) searchParams.set('contentType', params.contentType)
  if (params.testimonyCategoryId) searchParams.set('testimonyCategoryId', params.testimonyCategoryId)
  if (params.countryId) searchParams.set('countryId', params.countryId)
  if (params.zoneId) searchParams.set('zoneId', params.zoneId)
  if (params.search) searchParams.set('search', params.search)

  return fetchApi<PaginatedResponse<Testimony>>(`/api/testimonies?${searchParams}`)
}

export async function getTestimony(id: string): Promise<{ testimony: Testimony }> {
  return fetchApi<{ testimony: Testimony }>(`/api/testimonies/${id}`)
}

export async function updateTestimonyStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<{ testimony: Testimony }> {
  return fetchApi<{ testimony: Testimony }>(`/api/testimonies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteTestimony(id: string): Promise<void> {
  await fetchApi(`/api/testimonies/${id}`, { method: 'DELETE' })
}

export async function getStats(): Promise<StatsResponse> {
  return fetchApi<StatsResponse>('/api/admin/stats')
}

// Get filter options based on existing testimonies
export interface FilterOption {
  id: string
  name: string
  count: number
}

export interface FilterOptions {
  countries: FilterOption[]
  zones: FilterOption[]
  testimonyCategories: FilterOption[]
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return fetchApi<FilterOptions>('/api/admin/filters')
}

// Admin Network endpoints
export async function getAdminNetworks(): Promise<{ networks: Network[] }> {
  return fetchApi<{ networks: Network[] }>('/api/admin/networks')
}

export async function createNetwork(name: string): Promise<{ network: Network }> {
  return fetchApi<{ network: Network }>('/api/admin/networks', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateNetwork(
  id: string,
  data: { name?: string; isActive?: boolean }
): Promise<{ network: Network }> {
  return fetchApi<{ network: Network }>(`/api/admin/networks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteNetwork(id: string): Promise<void> {
  await fetchApi(`/api/admin/networks/${id}`, { method: 'DELETE' })
}

// Admin External Category endpoints
export async function getAdminExternalCategories(): Promise<{ categories: ExternalCategory[] }> {
  return fetchApi<{ categories: ExternalCategory[] }>('/api/admin/external')
}

export async function createExternalCategory(name: string): Promise<{ category: ExternalCategory }> {
  return fetchApi<{ category: ExternalCategory }>('/api/admin/external', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateExternalCategory(
  id: string,
  data: { name?: string; isActive?: boolean }
): Promise<{ category: ExternalCategory }> {
  return fetchApi<{ category: ExternalCategory }>(`/api/admin/external/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteExternalCategory(id: string): Promise<void> {
  await fetchApi(`/api/admin/external/${id}`, { method: 'DELETE' })
}

// Admin Storage Settings endpoints
export async function getStorageSettings(): Promise<StorageSettingsResponse> {
  return fetchApi<StorageSettingsResponse>('/api/admin/settings/storage')
}

export async function updateStorageSettings(
  data: Partial<StorageSettings>
): Promise<StorageSettingsResponse> {
  return fetchApi<StorageSettingsResponse>('/api/admin/settings/storage', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Admin Testimony Category endpoints
export async function getAdminTestimonyCategories(): Promise<{ categories: (TestimonyCategory & { _count: { testimonies: number } })[] }> {
  return fetchApi<{ categories: (TestimonyCategory & { _count: { testimonies: number } })[] }>('/api/admin/testimony-categories')
}

export async function createTestimonyCategory(name: string): Promise<{ category: TestimonyCategory }> {
  return fetchApi<{ category: TestimonyCategory }>('/api/admin/testimony-categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateTestimonyCategory(
  id: string,
  data: { name?: string; isActive?: boolean }
): Promise<{ category: TestimonyCategory }> {
  return fetchApi<{ category: TestimonyCategory }>(`/api/admin/testimony-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTestimonyCategory(id: string): Promise<void> {
  await fetchApi(`/api/admin/testimony-categories/${id}`, { method: 'DELETE' })
}

// Admin Profile endpoints
export interface AdminProfile {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export async function getAdminProfile(): Promise<{ admin: AdminProfile }> {
  return fetchApi<{ admin: AdminProfile }>('/api/admin/profile')
}

export async function updateAdminProfile(
  data: { name?: string; email?: string }
): Promise<{ admin: AdminProfile }> {
  return fetchApi<{ admin: AdminProfile }>('/api/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>('/api/admin/profile', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

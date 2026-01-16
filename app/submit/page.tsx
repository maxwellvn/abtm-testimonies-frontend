"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getNetworks, getExternalCategories, getTestimonyCategories, getZones, getCountries, getGroups, createGroup, submitTestimony } from '@/lib/api'
import type { Network, ExternalCategory, TestimonyCategory, Region, Country, Group, CategoryType, ContentType } from '@/types'
import { FileText, Video, Mic, Upload, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  testimonyCategoryId: z.string().min(1, 'Testimony type is required'),
  categoryType: z.enum(['NETWORK', 'EXTERNAL', 'REGION']),
  networkId: z.string().optional(),
  customNetwork: z.string().optional(),
  externalCategoryId: z.string().optional(),
  customExternal: z.string().optional(),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryId: z.string().min(1, 'Country is required'),
  phoneCountryCode: z.string().min(1, 'Country code is required'),
  phone: z.string().min(6, 'Invalid phone number'),
  church: z.string().optional(),
  kingschatUsername: z.string().optional(),
  contentType: z.enum(['TEXT', 'VIDEO', 'AUDIO']),
  textContent: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const STEPS = ['Category', 'Details', 'Personal Info', 'Testimony', 'Review']

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
}

export default function SubmitPage() {
  const [step, setStep] = useState(0)

  // Data states
  const [networks, setNetworks] = useState<Network[]>([])
  const [externalCategories, setExternalCategories] = useState<ExternalCategory[]>([])
  const [testimonyCategories, setTestimonyCategories] = useState<TestimonyCategory[]>([])
  const [zones, setZones] = useState<Region[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [file, setFile] = useState<File | null>(null)

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  // Error states
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)
  const [groupsError, setGroupsError] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryType: 'NETWORK',
      contentType: 'TEXT',
    },
  })

  const { watch, setValue, register, formState: { errors } } = form
  const testimonyCategoryId = watch('testimonyCategoryId') || ''
  const categoryType = watch('categoryType')
  const contentType = watch('contentType')
  const zoneId = watch('zoneId') || ''
  const networkId = watch('networkId') || ''
  const externalCategoryId = watch('externalCategoryId') || ''
  const groupId = watch('groupId') || ''
  const countryId = watch('countryId') || ''

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true)
    setInitialLoadError(null)
    try {
      const [n, e, tc, z, c] = await Promise.all([
        getNetworks(),
        getExternalCategories(),
        getTestimonyCategories(),
        getZones(),
        getCountries(),
      ])
      setNetworks(n)
      setExternalCategories(e)
      setTestimonyCategories(tc)
      setZones(z)
      setCountries(c)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setInitialLoadError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsInitialLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Load groups when zone changes
  const loadGroups = useCallback(async (zoneIdValue: string) => {
    setIsLoadingGroups(true)
    setGroupsError(null)
    setGroups([])
    try {
      const loadedGroups = await getGroups(zoneIdValue)
      setGroups(loadedGroups)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load groups'
      setGroupsError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoadingGroups(false)
    }
  }, [toast])

  useEffect(() => {
    if (zoneId) {
      loadGroups(zoneId)
      setValue('groupId', undefined)
      setValue('newGroupName', undefined)
    }
  }, [zoneId, loadGroups, setValue])

  // Computed values
  const selectedCountry = countries.find(c => c.id === countryId)
  const selectedZone = zones.flatMap(r => r.zones).find(z => z.id === zoneId)
  const selectedGroup = groups.find(g => g.id === groupId)
  const selectedNetwork = networks.find(n => n.id === networkId)
  const selectedExternalCategory = externalCategories.find(c => c.id === externalCategoryId)
  const selectedTestimonyCategory = testimonyCategories.find(c => c.id === testimonyCategoryId)
  const allZones = zones.flatMap(r => r.zones)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const maxSize = contentType === 'VIDEO' ? 100 * 1024 * 1024 : 20 * 1024 * 1024
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File too large',
          description: `Maximum size is ${contentType === 'VIDEO' ? '100MB' : '20MB'}`,
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const canProceed = () => {
    const hasGroup = (groupId && groupId !== 'new') || !!watch('newGroupName')
    const hasChurch = !!watch('church')

    switch (step) {
      case 0: return !!categoryType && !!testimonyCategoryId
      case 1:
        if (categoryType === 'NETWORK') return !!networkId || !!watch('customNetwork')
        if (categoryType === 'EXTERNAL') return !!externalCategoryId || !!watch('customExternal')
        if (categoryType === 'REGION') return !!zoneId && hasGroup && hasChurch
        return false
      case 2: return !!watch('name') && !!watch('email') && !!countryId && !!watch('phone')
      case 3: return contentType === 'TEXT' ? !!watch('textContent') : !!file
      default: return true
    }
  }

  const handleNext = () => step < STEPS.length - 1 && setStep(step + 1)
  const handleBack = () => step > 0 && setStep(step - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const data = form.getValues()
      let finalGroupId = data.groupId

      // Create new group if needed
      if (data.categoryType === 'REGION' && data.newGroupName && data.zoneId && data.groupId === 'new') {
        setIsCreatingGroup(true)
        try {
          const newGroup = await createGroup({ name: data.newGroupName, zoneId: data.zoneId })
          finalGroupId = newGroup.id
        } catch (err) {
          toast({
            title: 'Failed to create group',
            description: err instanceof Error ? err.message : 'Please try again',
            variant: 'destructive'
          })
          return
        } finally {
          setIsCreatingGroup(false)
        }
      }

      await submitTestimony({
        testimonyCategoryId: data.testimonyCategoryId,
        categoryType: data.categoryType as CategoryType,
        networkId: data.categoryType === 'NETWORK' && networkId !== 'other' ? data.networkId : undefined,
        customNetwork: data.categoryType === 'NETWORK' && networkId === 'other' ? data.customNetwork : undefined,
        externalCategoryId: data.categoryType === 'EXTERNAL' && externalCategoryId !== 'other' ? data.externalCategoryId : undefined,
        customExternal: data.categoryType === 'EXTERNAL' && externalCategoryId === 'other' ? data.customExternal : undefined,
        zoneId: data.categoryType === 'REGION' ? data.zoneId : undefined,
        groupId: data.categoryType === 'REGION' && finalGroupId !== 'new' ? finalGroupId : undefined,
        name: data.name,
        email: data.email,
        phone: data.phone,
        phoneCountryCode: data.phoneCountryCode,
        countryId: data.countryId,
        church: data.categoryType === 'REGION' ? data.church : undefined,
        kingschatUsername: data.kingschatUsername,
        contentType: data.contentType as ContentType,
        textContent: data.contentType === 'TEXT' ? data.textContent : undefined,
      }, file || undefined)

      router.push('/submit/success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again'
      // Show each validation error on a new line
      const formattedMessage = errorMessage.split('\n').map(line => `• ${line}`).join('\n')
      toast({
        title: 'Submission failed',
        description: (
          <pre className="whitespace-pre-wrap text-sm font-sans">{formattedMessage}</pre>
        ),
        variant: 'destructive',
        duration: 10000, // Show for 10 seconds so user can read all errors
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="relative overflow-hidden bg-[#0f0f1a] py-16 md:py-24 lg:py-28">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-7 w-36 mx-auto mb-6 rounded-full bg-white/10" />
            <Skeleton className="h-10 md:h-14 w-72 md:w-96 mx-auto mb-2 bg-white/15" />
            <Skeleton className="h-10 md:h-14 w-40 md:w-48 mx-auto mb-4 bg-white/10" />
            <Skeleton className="h-5 w-64 mx-auto bg-white/5" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1,2,3,4,5].map(i => (
              <Skeleton key={i} className="w-8 h-8 rounded-full" />
            ))}
          </div>
          <div className="bg-white border rounded-lg p-4 md:p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state with retry
  if (initialLoadError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="relative overflow-hidden bg-[#0f0f1a] py-16 md:py-24 lg:py-28">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs md:text-sm text-white/70 font-medium tracking-wide uppercase">Share Your Story</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              A Billion Testimonies
              <span className="block mt-1 md:mt-2 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                & More
              </span>
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Join millions sharing testimonies of God&apos;s faithfulness across the world
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
          <div className="bg-white border rounded-lg p-6 md:p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Failed to load form</h2>
            <p className="text-gray-500 mb-6 text-sm md:text-base">{initialLoadError}</p>
            <Button onClick={loadInitialData} className="bg-[#1a1a2e] hover:bg-[#2a2a4e]">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#0f0f1a]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f1a]/50 to-[#0f0f1a]" />

        <div className="relative py-16 md:py-24 lg:py-28">
          <div className="container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs md:text-sm text-white/70 font-medium tracking-wide uppercase">Share Your Story</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              A Billion Testimonies
              <span className="block mt-1 md:mt-2 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                & More
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/50 text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Join millions sharing testimonies of God&apos;s faithfulness across the world
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        {/* Progress - Mobile optimized */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-medium border-2 transition-colors",
                  i < step ? "bg-[#1a1a2e] border-[#1a1a2e] text-white" :
                  i === step ? "border-[#1a1a2e] text-[#1a1a2e]" :
                  "border-gray-200 text-gray-400"
                )}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={cn(
                  "text-[8px] sm:text-[10px] md:text-xs mt-1 whitespace-nowrap max-w-[50px] sm:max-w-none truncate text-center",
                  i <= step ? "text-gray-900" : "text-gray-400"
                )}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 sm:mx-2 min-w-[8px] transition-colors",
                  i < step ? "bg-[#1a1a2e]" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white border rounded-lg p-4 md:p-6">

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="font-medium text-base md:text-lg">Testimony Type *</h2>
                <Select value={testimonyCategoryId} onValueChange={(v) => setValue('testimonyCategoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={testimonyCategories.length === 0 ? "No types available" : "What is your testimony about?"} />
                  </SelectTrigger>
                  <SelectContent>
                    {testimonyCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h2 className="font-medium text-base md:text-lg">Select Category *</h2>
                {[
                  { value: 'NETWORK', label: 'Network', desc: 'REON, TNI, Youths Aglow, etc.' },
                  { value: 'EXTERNAL', label: 'External Category', desc: 'Other categories' },
                  { value: 'REGION', label: 'Zone / Group / Church', desc: '' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('categoryType', opt.value as CategoryType)}
                    className={cn(
                      "w-full p-3 md:p-4 rounded-lg border text-left transition-all active:scale-[0.99]",
                      categoryType === opt.value
                        ? "border-[#1a1a2e] bg-gray-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="font-medium text-sm md:text-base">{opt.label}</div>
                    {opt.desc && <div className="text-xs md:text-sm text-gray-500 mt-0.5">{opt.desc}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-medium text-base md:text-lg mb-4">
                {categoryType === 'NETWORK' && 'Select Network'}
                {categoryType === 'EXTERNAL' && 'Select Category'}
                {categoryType === 'REGION' && 'Select Zone, Group & Church'}
              </h2>

              {categoryType === 'NETWORK' && (
                <>
                  <div>
                    <Label className="text-sm">Network *</Label>
                    <Select value={networkId} onValueChange={(v) => setValue('networkId', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={networks.length === 0 ? "No networks available" : "Choose network"} />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {networkId === 'other' && (
                    <div>
                      <Label className="text-sm">Network Name *</Label>
                      <Input {...register('customNetwork')} placeholder="Enter network name" className="mt-1" />
                    </div>
                  )}
                </>
              )}

              {categoryType === 'EXTERNAL' && (
                <>
                  <div>
                    <Label className="text-sm">Category *</Label>
                    <Select value={externalCategoryId} onValueChange={(v) => setValue('externalCategoryId', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={externalCategories.length === 0 ? "No categories available" : "Choose category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {externalCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {externalCategoryId === 'other' && (
                    <div>
                      <Label className="text-sm">Category Name *</Label>
                      <Input {...register('customExternal')} placeholder="Enter category name" className="mt-1" />
                    </div>
                  )}
                </>
              )}

              {categoryType === 'REGION' && (
                <>
                  <div>
                    <Label className="text-sm">Zone *</Label>
                    <Select value={zoneId} onValueChange={(v) => { setValue('zoneId', v); setValue('groupId', undefined); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={allZones.length === 0 ? "No zones available" : "Select zone"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allZones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {zoneId && (
                    <div>
                      <Label className="text-sm">Group *</Label>
                      <Select
                        value={groupId}
                        onValueChange={(v) => setValue('groupId', v)}
                        disabled={isLoadingGroups}
                      >
                        <SelectTrigger className="mt-1">
                          {isLoadingGroups ? (
                            <span className="flex items-center text-gray-500">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading groups...
                            </span>
                          ) : (
                            <SelectValue placeholder={groupsError ? "Error loading groups" : "Select group"} />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          <SelectItem value="new">+ Add new group</SelectItem>
                        </SelectContent>
                      </Select>
                      {groupsError && (
                        <button
                          onClick={() => loadGroups(zoneId)}
                          className="text-sm text-[#1a1a2e] hover:underline mt-1 flex items-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Retry
                        </button>
                      )}
                    </div>
                  )}

                  {groupId === 'new' && (
                    <div>
                      <Label className="text-sm">New Group Name *</Label>
                      <Input {...register('newGroupName')} placeholder="Enter group name" className="mt-1" />
                    </div>
                  )}

                  {((groupId && groupId !== 'new') || watch('newGroupName')) && (
                    <div>
                      <Label className="text-sm">Church *</Label>
                      <Input {...register('church')} placeholder="Your church name" className="mt-1" />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-medium text-base md:text-lg mb-4">Personal Information</h2>

              <div>
                <Label className="text-sm">Full Name *</Label>
                <Input {...register('name')} placeholder="Your name" className="mt-1" />
                {errors.name && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label className="text-sm">Email *</Label>
                <Input {...register('email')} type="email" placeholder="email@example.com" className="mt-1" />
                {errors.email && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label className="text-sm">Country *</Label>
                <Select value={countryId} onValueChange={(v) => {
                  setValue('countryId', v)
                  const c = countries.find(x => x.id === v)
                  if (c) setValue('phoneCountryCode', c.phoneCode)
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={countries.length === 0 ? "No countries available" : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Phone *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={selectedCountry?.phoneCode || ''}
                    disabled
                    className="w-16 md:w-20 text-center bg-gray-50"
                  />
                  <Input {...register('phone')} placeholder="Phone number" className="flex-1" />
                </div>
                {errors.phone && <p className="text-xs md:text-sm text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <Label className="text-sm">KingsChat Username</Label>
                <Input {...register('kingschatUsername')} placeholder="Optional" className="mt-1" />
              </div>
            </div>
          )}

          {/* Step 3: Testimony */}
          {step === 3 && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="font-medium text-base md:text-lg mb-4">Your Testimony</h2>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'TEXT', label: 'Text', icon: FileText },
                  { value: 'VIDEO', label: 'Video', icon: Video },
                  { value: 'AUDIO', label: 'Audio', icon: Mic },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setValue('contentType', opt.value as ContentType)
                      if (opt.value === 'TEXT') setFile(null)
                      else setValue('textContent', undefined)
                    }}
                    className={cn(
                      "py-3 md:py-4 rounded-lg border text-center transition-all active:scale-[0.98]",
                      contentType === opt.value
                        ? "border-[#1a1a2e] bg-gray-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <opt.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1" />
                    <span className="text-xs md:text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>

              {contentType === 'TEXT' && (
                <Textarea
                  {...register('textContent')}
                  placeholder="Share your testimony..."
                  className="min-h-[150px] md:min-h-[200px] text-sm md:text-base"
                />
              )}

              {(contentType === 'VIDEO' || contentType === 'AUDIO') && (
                <label className={cn(
                  "flex flex-col items-center justify-center h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                )}>
                  {file ? (
                    <div className="text-center px-4">
                      <Check className="w-6 h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700 text-sm md:text-base truncate max-w-[200px] md:max-w-[300px]">{file.name}</p>
                      <p className="text-xs md:text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-xs text-green-600 mt-1">Tap to change</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 px-4">
                      <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                      <p className="text-sm md:text-base">Tap to upload {contentType.toLowerCase()}</p>
                      <p className="text-xs">Max {contentType === 'VIDEO' ? '100' : '20'}MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={contentType === 'VIDEO' ? 'video/*' : 'audio/*'}
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-medium text-base md:text-lg mb-4">Review & Submit</h2>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Testimony Type</span>
                  <span className="text-right truncate">{selectedTestimonyCategory?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Category</span>
                  <span className="text-right">{categoryType === 'NETWORK' ? 'Network' : categoryType === 'EXTERNAL' ? 'External' : 'Zone/Group/Church'}</span>
                </div>
                {categoryType === 'NETWORK' && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">Network</span>
                    <span className="text-right truncate">{networkId === 'other' ? watch('customNetwork') : selectedNetwork?.name}</span>
                  </div>
                )}
                {categoryType === 'EXTERNAL' && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">External Category</span>
                    <span className="text-right truncate">{externalCategoryId === 'other' ? watch('customExternal') : selectedExternalCategory?.name}</span>
                  </div>
                )}
                {categoryType === 'REGION' && (
                  <>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Zone</span>
                      <span className="text-right truncate">{selectedZone?.name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Group</span>
                      <span className="text-right truncate">{groupId === 'new' ? watch('newGroupName') : selectedGroup?.name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Church</span>
                      <span className="text-right truncate">{watch('church')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-2 pt-2 border-t">
                  <span className="text-gray-500 flex-shrink-0">Name</span>
                  <span className="text-right truncate">{watch('name')}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Email</span>
                  <span className="text-right truncate">{watch('email')}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Phone</span>
                  <span className="text-right">{watch('phoneCountryCode')} {watch('phone')}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Content Type</span>
                  <span className="text-right">{contentType}</span>
                </div>
                {contentType === 'TEXT' && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-500 block mb-1">Testimony</span>
                    <p className="line-clamp-3 text-xs md:text-sm">{watch('textContent')}</p>
                  </div>
                )}
                {file && (
                  <div className="flex justify-between gap-2 pt-2 border-t">
                    <span className="text-gray-500 flex-shrink-0">File</span>
                    <span className="text-right truncate max-w-[150px] md:max-w-[250px]">{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation - Mobile optimized */}
          <div className="flex justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="flex-1 md:flex-none"
            >
              <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 md:flex-none bg-[#1a1a2e] hover:bg-[#2a2a4e]"
              >
                <span className="hidden sm:inline">Continue</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isCreatingGroup}
                className="flex-1 md:flex-none bg-[#1a1a2e] hover:bg-[#2a2a4e]"
              >
                {isSubmitting || isCreatingGroup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{isCreatingGroup ? 'Creating group...' : 'Submitting...'}</span>
                    <span className="sm:hidden">Wait...</span>
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

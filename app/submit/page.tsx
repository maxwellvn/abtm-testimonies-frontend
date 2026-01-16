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
import { getNetworks, getExternalCategories, getZones, getCountries, getGroups, createGroup, submitTestimony } from '@/lib/api'
import type { Network, ExternalCategory, Region, Country, Group, CategoryType, ContentType } from '@/types'
import { FileText, Video, Mic, Upload, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  categoryType: z.enum(['NETWORK', 'EXTERNAL', 'REGION']),
  networkId: z.string().optional(),
  customNetwork: z.string().optional(),
  externalCategoryId: z.string().optional(),
  customExternal: z.string().optional(),
  regionId: z.string().optional(),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryId: z.string().min(1, 'Country is required'),
  phoneCountryCode: z.string().min(1, 'Country code is required'),
  phone: z.string().min(6, 'Invalid phone number'),
  church: z.string().min(2, 'Church name is required'),
  kingschatUsername: z.string().optional(),
  userRegionId: z.string().optional(),
  userZoneId: z.string().optional(),
  userGroupId: z.string().optional(),
  contentType: z.enum(['TEXT', 'VIDEO', 'AUDIO']),
  textContent: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const STEPS = ['Category', 'Details', 'Personal Info', 'Testimony', 'Review']

export default function SubmitPage() {
  const [step, setStep] = useState(0)
  const [networks, setNetworks] = useState<Network[]>([])
  const [externalCategories, setExternalCategories] = useState<ExternalCategory[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
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
  const categoryType = watch('categoryType')
  const contentType = watch('contentType')
  const regionId = watch('regionId')
  const zoneId = watch('zoneId')
  const userRegionId = watch('userRegionId')
  const userZoneId = watch('userZoneId')
  const networkId = watch('networkId')
  const externalCategoryId = watch('externalCategoryId')

  useEffect(() => {
    Promise.all([
      getNetworks(),
      getExternalCategories(),
      getZones(),
      getCountries(),
    ]).then(([n, e, z, c]) => {
      setNetworks(n)
      setExternalCategories(e)
      setRegions(z)
      setCountries(c)
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    })
  }, [toast])

  const loadGroups = useCallback(async (zoneIdValue: string, setter: (groups: Group[]) => void) => {
    setIsLoadingGroups(true)
    try {
      const groups = await getGroups(zoneIdValue)
      setter(groups)
    } catch {
      toast({ title: 'Error', description: 'Failed to load groups', variant: 'destructive' })
    } finally {
      setIsLoadingGroups(false)
    }
  }, [toast])

  useEffect(() => {
    if (zoneId) {
      loadGroups(zoneId, setGroups)
      setValue('groupId', undefined)
    }
  }, [zoneId, loadGroups, setValue])

  useEffect(() => {
    if (userZoneId) {
      loadGroups(userZoneId, setUserGroups)
      setValue('userGroupId', undefined)
    }
  }, [userZoneId, loadGroups, setValue])

  const selectedRegion = regions.find(r => r.id === regionId)
  const selectedUserRegion = regions.find(r => r.id === userRegionId)
  const selectedCountry = countries.find(c => c.id === watch('countryId'))

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
    switch (step) {
      case 0: return !!categoryType
      case 1:
        if (categoryType === 'NETWORK') return !!networkId || !!watch('customNetwork')
        if (categoryType === 'EXTERNAL') return !!externalCategoryId || !!watch('customExternal')
        if (categoryType === 'REGION') return !!zoneId
        return false
      case 2: return !!watch('name') && !!watch('email') && !!watch('countryId') && !!watch('phone') && !!watch('church')
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
      if (data.newGroupName && data.zoneId && !data.groupId) {
        const newGroup = await createGroup({ name: data.newGroupName, zoneId: data.zoneId })
        finalGroupId = newGroup.id
      }

      await submitTestimony({
        categoryType: data.categoryType as CategoryType,
        networkId: data.categoryType === 'NETWORK' && networkId !== 'other' ? data.networkId : undefined,
        customNetwork: data.categoryType === 'NETWORK' && networkId === 'other' ? data.customNetwork : undefined,
        externalCategoryId: data.categoryType === 'EXTERNAL' && externalCategoryId !== 'other' ? data.externalCategoryId : undefined,
        customExternal: data.categoryType === 'EXTERNAL' && externalCategoryId === 'other' ? data.customExternal : undefined,
        zoneId: data.categoryType === 'REGION' ? data.zoneId : undefined,
        groupId: data.categoryType === 'REGION' ? finalGroupId : undefined,
        name: data.name,
        email: data.email,
        phone: data.phone,
        phoneCountryCode: data.phoneCountryCode,
        countryId: data.countryId,
        userZoneId: data.userZoneId,
        userGroupId: data.userGroupId,
        church: data.church,
        kingschatUsername: data.kingschatUsername,
        contentType: data.contentType as ContentType,
        textContent: data.contentType === 'TEXT' ? data.textContent : undefined,
      }, file || undefined)
      router.push('/submit/success')
    } catch (error) {
      toast({ title: 'Submission failed', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="bg-[#1a1a2e] py-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Share Your Testimony</h1>
          <p className="text-white/60">Your story can inspire others</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                  i < step ? "bg-[#1a1a2e] border-[#1a1a2e] text-white" :
                  i === step ? "border-[#1a1a2e] text-[#1a1a2e]" :
                  "border-gray-200 text-gray-400"
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn(
                  "text-xs mt-1.5 hidden sm:block",
                  i <= step ? "text-gray-900" : "text-gray-400"
                )}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-12 sm:w-20 h-0.5 mx-1", i < step ? "bg-[#1a1a2e]" : "bg-gray-200")} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white border rounded-lg p-6">

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-3">
              <h2 className="font-medium text-lg mb-4">Select Category</h2>
              {[
                { value: 'NETWORK', label: 'Network', desc: 'REON, TNI, Youths Aglow, etc.' },
                { value: 'EXTERNAL', label: 'External Category', desc: 'Other categories' },
                { value: 'REGION', label: 'Region / Zone / Group', desc: 'By location' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('categoryType', opt.value as CategoryType)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-colors",
                    categoryType === opt.value ? "border-[#1a1a2e] bg-gray-50" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-medium text-lg mb-4">
                {categoryType === 'NETWORK' && 'Select Network'}
                {categoryType === 'EXTERNAL' && 'Select Category'}
                {categoryType === 'REGION' && 'Select Location'}
              </h2>

              {categoryType === 'NETWORK' && (
                <>
                  <Select value={networkId} onValueChange={(v) => setValue('networkId', v)}>
                    <SelectTrigger><SelectValue placeholder="Choose network" /></SelectTrigger>
                    <SelectContent>
                      {networks.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {networkId === 'other' && (
                    <Input {...register('customNetwork')} placeholder="Enter network name" />
                  )}
                </>
              )}

              {categoryType === 'EXTERNAL' && (
                <>
                  <Select value={externalCategoryId} onValueChange={(v) => setValue('externalCategoryId', v)}>
                    <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                    <SelectContent>
                      {externalCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {externalCategoryId === 'other' && (
                    <Input {...register('customExternal')} placeholder="Enter category name" />
                  )}
                </>
              )}

              {categoryType === 'REGION' && (
                <>
                  <Select value={regionId} onValueChange={(v) => { setValue('regionId', v); setValue('zoneId', undefined); }}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedRegion && (
                    <Select value={zoneId} onValueChange={(v) => { setValue('zoneId', v); setValue('groupId', undefined); }}>
                      <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                      <SelectContent>
                        {selectedRegion.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {zoneId && (
                    <Select value={watch('groupId')} onValueChange={(v) => setValue('groupId', v)} disabled={isLoadingGroups}>
                      <SelectTrigger><SelectValue placeholder="Select group (optional)" /></SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        <SelectItem value="new">+ Add new group</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {watch('groupId') === 'new' && (
                    <Input {...register('newGroupName')} placeholder="New group name" />
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-medium text-lg mb-4">Personal Information</h2>

              <div>
                <Label>Full Name *</Label>
                <Input {...register('name')} placeholder="Your name" className="mt-1" />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label>Email *</Label>
                <Input {...register('email')} type="email" placeholder="email@example.com" className="mt-1" />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label>Country *</Label>
                <Select value={watch('countryId')} onValueChange={(v) => {
                  setValue('countryId', v)
                  const c = countries.find(x => x.id === v)
                  if (c) setValue('phoneCountryCode', c.phoneCode)
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Phone *</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={selectedCountry?.phoneCode || ''} disabled className="w-20" />
                  <Input {...register('phone')} placeholder="Phone number" className="flex-1" />
                </div>
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <Label>Church *</Label>
                <Input {...register('church')} placeholder="Your church" className="mt-1" />
                {errors.church && <p className="text-sm text-red-500 mt-1">{errors.church.message}</p>}
              </div>

              <div>
                <Label>KingsChat Username</Label>
                <Input {...register('kingschatUsername')} placeholder="Optional" className="mt-1" />
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-gray-500">Your Location (Optional)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Select value={userRegionId} onValueChange={(v) => { setValue('userRegionId', v); setValue('userZoneId', undefined); }}>
                    <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedUserRegion && (
                    <Select value={userZoneId} onValueChange={(v) => { setValue('userZoneId', v); setValue('userGroupId', undefined); }}>
                      <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
                      <SelectContent>
                        {selectedUserRegion.zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {userZoneId && (
                    <Select value={watch('userGroupId')} onValueChange={(v) => setValue('userGroupId', v)}>
                      <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
                      <SelectContent>
                        {userGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Testimony */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-medium text-lg mb-4">Your Testimony</h2>

              <div className="flex gap-2">
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
                      "flex-1 py-3 rounded-lg border text-center transition-colors",
                      contentType === opt.value ? "border-[#1a1a2e] bg-gray-50" : "border-gray-200"
                    )}
                  >
                    <opt.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>

              {contentType === 'TEXT' && (
                <Textarea
                  {...register('textContent')}
                  placeholder="Share your testimony..."
                  className="min-h-[200px]"
                />
              )}

              {(contentType === 'VIDEO' || contentType === 'AUDIO') && (
                <label className={cn(
                  "flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer",
                  file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                )}>
                  {file ? (
                    <div className="text-center">
                      <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700">{file.name}</p>
                      <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p>Click to upload {contentType.toLowerCase()}</p>
                      <p className="text-xs">Max {contentType === 'VIDEO' ? '100' : '20'}MB</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept={contentType === 'VIDEO' ? 'video/*' : 'audio/*'} onChange={handleFileChange} />
                </label>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-medium text-lg mb-4">Review & Submit</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{watch('name')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{watch('email')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{watch('phoneCountryCode')} {watch('phone')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Church</span><span>{watch('church')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{categoryType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span>{contentType}</span></div>
                {contentType === 'TEXT' && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-500 block mb-1">Testimony</span>
                    <p className="line-clamp-3">{watch('textContent')}</p>
                  </div>
                )}
                {file && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-500">File</span>
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="bg-[#1a1a2e] hover:bg-[#2a2a4e]">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1a1a2e] hover:bg-[#2a2a4e]">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

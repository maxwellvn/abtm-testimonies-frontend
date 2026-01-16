import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const testimonySchema = z.object({
  categoryType: z.enum(['NETWORK', 'EXTERNAL', 'REGION']),
  networkId: z.string().optional(),
  customNetwork: z.string().optional(),
  externalCategoryId: z.string().optional(),
  customExternal: z.string().optional(),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Invalid phone number'),
  phoneCountryCode: z.string().min(1, 'Country code is required'),
  countryId: z.string().min(1, 'Country is required'),
  userZoneId: z.string().optional(),
  userGroupId: z.string().optional(),
  church: z.string().min(2, 'Church name is required'),
  kingschatUsername: z.string().optional(),
  contentType: z.enum(['TEXT', 'VIDEO', 'AUDIO']),
  textContent: z.string().optional(),
})

export const networkSchema = z.object({
  name: z.string().min(2, 'Network name must be at least 2 characters'),
})

export const externalCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
})

export const groupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  zoneId: z.string().min(1, 'Zone is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type TestimonyInputSchema = z.infer<typeof testimonySchema>
export type NetworkInput = z.infer<typeof networkSchema>
export type ExternalCategoryInput = z.infer<typeof externalCategorySchema>
export type GroupInput = z.infer<typeof groupSchema>

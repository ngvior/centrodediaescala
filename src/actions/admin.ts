'use server'

import { revalidatePath } from 'next/cache'

import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminProfessional = {
  id: string
  first_name: string
  last_name: string
  role: string
  bio: string | null
  image_url: string | null
  is_active: boolean
  order_index: number
}

export type LatestInterviewRequest = {
  id: string
  contact_name: string
  patient_name: string | null
  phone: string
  status: string
  created_at: string
}

export type AdminDashboardData = {
  pendingInterviewRequests: number
  activeProfessionals: number
  activeActivities: number
  latestInterviewRequests: LatestInterviewRequest[]
}

type SupabaseResponse<T> = {
  data: T | null
  error: { message: string } | null
}

type SupabaseCountResponse = {
  count: number | null
  error: { message: string } | null
}

function assertMutationSucceeded(tableName: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`Supabase mutation failed for ${tableName}: ${error.message}`)
  }
}

function assertReadSucceeded<T>(tableName: string, response: SupabaseResponse<T>): T {
  if (response.error) {
    throw new Error(`Supabase admin read failed for ${tableName}: ${response.error.message}`)
  }

  if (!response.data) {
    throw new Error(`Supabase admin read returned no data for ${tableName}`)
  }

  return response.data
}

function assertCountSucceeded(tableName: string, response: SupabaseCountResponse) {
  if (response.error) {
    throw new Error(`Supabase count failed for ${tableName}: ${response.error.message}`)
  }

  return response.count ?? 0
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`El campo ${key} es obligatorio`)
  }

  return value.trim()
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== 'string' || value.trim().length === 0) {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo ${key} debe ser numérico`)
  }

  return parsed
}

function revalidateProfessionalPaths() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/profesionales')
  revalidatePath('/')
}

export async function getAdminProfessionals(): Promise<AdminProfessional[]> {
  await requireAdmin()

  const supabase = createAdminClient()
  const response = await supabase
    .from('professionals')
    .select('id, first_name, last_name, role, bio, image_url, is_active, order_index')
    .order('order_index', { ascending: true })
    .order('last_name', { ascending: true })

  return assertReadSucceeded(
    'professionals',
    response as SupabaseResponse<AdminProfessional[]>
  )
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdmin()

  const supabase = createAdminClient()
  const [pendingRequests, activeProfessionals, activeActivities, latestRequests] =
    await Promise.all([
      supabase
        .from('interview_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('interview_requests')
        .select('id, contact_name, patient_name, phone, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  return {
    pendingInterviewRequests: assertCountSucceeded(
      'interview_requests',
      pendingRequests as SupabaseCountResponse
    ),
    activeProfessionals: assertCountSucceeded(
      'professionals',
      activeProfessionals as SupabaseCountResponse
    ),
    activeActivities: assertCountSucceeded(
      'activities',
      activeActivities as SupabaseCountResponse
    ),
    latestInterviewRequests: assertReadSucceeded(
      'interview_requests',
      latestRequests as SupabaseResponse<LatestInterviewRequest[]>
    ),
  }
}

export async function createProfessional(formData: FormData) {
  await requireAdmin()

  const supabase = createAdminClient()
  const { error } = await supabase.from('professionals').insert({
    first_name: getRequiredString(formData, 'first_name'),
    last_name: getRequiredString(formData, 'last_name'),
    role: getRequiredString(formData, 'role'),
    bio: getOptionalString(formData, 'bio'),
    image_url: getOptionalString(formData, 'image_url') ?? '/profile.jpg',
    is_active: true,
    order_index: getOptionalNumber(formData, 'order_index'),
  })

  assertMutationSucceeded('professionals', error)
  revalidateProfessionalPaths()
}

export async function updateProfessional(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('professionals')
    .update({
      first_name: getRequiredString(formData, 'first_name'),
      last_name: getRequiredString(formData, 'last_name'),
      role: getRequiredString(formData, 'role'),
      bio: getOptionalString(formData, 'bio'),
      image_url: getOptionalString(formData, 'image_url'),
      is_active: formData.get('is_active') === 'on',
      order_index: getOptionalNumber(formData, 'order_index'),
    })
    .eq('id', id)

  assertMutationSucceeded('professionals', error)
  revalidateProfessionalPaths()
}

export async function deleteProfessional(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const supabase = createAdminClient()
  const { error } = await supabase.from('professionals').delete().eq('id', id)

  assertMutationSucceeded('professionals', error)
  revalidateProfessionalPaths()
}

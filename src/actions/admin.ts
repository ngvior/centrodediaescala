'use server'

import { revalidatePath } from 'next/cache'

import { requireAdmin } from '@/lib/auth/admin'
import {
  buildAdminSiteSettings,
  getSiteSettingDefinition,
  normalizeSiteSettingValue,
  type AdminSiteSetting,
  type SiteSettingRow,
} from '@/lib/site-settings'
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

export type AdminActivity = {
  id: string
  title: string
  description: string
  category: string
  image_url: string | null
  schedule_info: string | null
  is_active: boolean
  order_index: number
}

export type AdminGalleryItem = {
  id: string
  title: string
  category: string
  image_url: string
  is_active: boolean
  order_index: number
}

export type InterviewRequestStatus = 'PENDING' | 'CONTACTED' | 'CONFIRMED' | 'REJECTED'

export type AdminInterviewRequest = {
  id: string
  contact_name: string
  patient_name: string | null
  phone: string
  email: string | null
  message: string | null
  status: InterviewRequestStatus
  notes: string | null
  created_at: string
}

export type LatestInterviewRequest = {
  id: string
  contact_name: string
  patient_name: string | null
  phone: string
  status: InterviewRequestStatus
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

const INTERVIEW_REQUEST_STATUSES: InterviewRequestStatus[] = [
  'PENDING',
  'CONTACTED',
  'CONFIRMED',
  'REJECTED',
]

const MAX_INTERVIEW_NOTES_LENGTH = 2000

function isInterviewRequestStatus(value: string): value is InterviewRequestStatus {
  return INTERVIEW_REQUEST_STATUSES.includes(value as InterviewRequestStatus)
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

function getCheckboxBoolean(formData: FormData, key: string, defaultValue = false) {
  const value = formData.get(key)

  if (value === null) {
    return defaultValue
  }

  return value === 'on' || value === 'true' || value === '1'
}

function revalidateProfessionalPaths() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/profesionales')
  revalidatePath('/')
}

function revalidateActivityPaths() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/actividades')
  revalidatePath('/')
}

function revalidateGalleryPaths() {
  revalidatePath('/admin/galeria')
  revalidatePath('/')
}

function revalidateSiteSettingPaths() {
  revalidatePath('/')
  revalidatePath('/admin/configuracion')
}

function revalidateInterviewCrmPaths() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/entrevistas')
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

export async function getAdminActivities(): Promise<AdminActivity[]> {
  await requireAdmin()

  const supabase = createAdminClient()
  const response = await supabase
    .from('activities')
    .select('id, title, description, category, image_url, schedule_info, is_active, order_index')
    .order('order_index', { ascending: true })
    .order('title', { ascending: true })

  return assertReadSucceeded('activities', response as SupabaseResponse<AdminActivity[]>)
}

export async function getAdminGalleryItems(): Promise<AdminGalleryItem[]> {
  await requireAdmin()

  const supabase = createAdminClient()
  const response = await supabase
    .from('gallery_items')
    .select('id, title, category, image_url, is_active, order_index')
    .order('order_index', { ascending: true })
    .order('title', { ascending: true })

  return assertReadSucceeded(
    'gallery_items',
    response as SupabaseResponse<AdminGalleryItem[]>
  )
}

export async function getAdminInterviewRequests(
  status?: string | null
): Promise<AdminInterviewRequest[]> {
  await requireAdmin()

  const statusFilter = status?.trim()

  if (statusFilter && !isInterviewRequestStatus(statusFilter)) {
    throw new Error(`Estado de entrevista inválido: ${statusFilter}`)
  }

  const supabase = createAdminClient()
  const query = supabase
    .from('interview_requests')
    .select('id, contact_name, patient_name, phone, email, message, status, notes, created_at')

  if (statusFilter) {
    query.eq('status', statusFilter)
  }

  const response = await query.order('created_at', { ascending: false })

  return assertReadSucceeded(
    'interview_requests',
    response as SupabaseResponse<AdminInterviewRequest[]>
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

export async function getAdminSiteSettings(): Promise<AdminSiteSetting[]> {
  await requireAdmin()

  const supabase = createAdminClient()
  const response = await supabase
    .from('site_settings')
    .select('setting_key, setting_value, setting_type, setting_group, description')

  const rows = assertReadSucceeded(
    'site_settings',
    response as SupabaseResponse<SiteSettingRow[]>
  )

  return buildAdminSiteSettings(rows)
}

export async function updateSiteSetting(formData: FormData) {
  await requireAdmin()

  const settingKey = getRequiredString(formData, 'setting_key')
  const settingType = getRequiredString(formData, 'setting_type')
  const rawValue = formData.get('setting_value')

  if (typeof rawValue !== 'string') {
    throw new Error('El valor de configuración es obligatorio')
  }

  const normalizedValue = normalizeSiteSettingValue(settingKey, rawValue, settingType)
  const definition = getSiteSettingDefinition(settingKey)

  if (!definition) {
    throw new Error(`Configuración desconocida: ${settingKey}`)
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('site_settings')
    .update({
      setting_group: definition.group,
      setting_value: normalizedValue,
      setting_type: definition.type,
      description: definition.description,
      updated_at: new Date().toISOString(),
    })
    .eq('setting_key', definition.key)

  assertMutationSucceeded('site_settings', error)
  revalidateSiteSettingPaths()
}

export async function updateInterviewRequestCrm(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const status = getRequiredString(formData, 'status')

  if (!isInterviewRequestStatus(status)) {
    throw new Error(`Estado de entrevista inválido: ${status}`)
  }

  const notes = getOptionalString(formData, 'notes')

  if (notes && notes.length > MAX_INTERVIEW_NOTES_LENGTH) {
    throw new Error(`Las notas internas no pueden superar ${MAX_INTERVIEW_NOTES_LENGTH} caracteres`)
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('interview_requests')
    .update({ status, notes })
    .eq('id', id)

  assertMutationSucceeded('interview_requests', error)
  revalidateInterviewCrmPaths()
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

export async function createActivity(formData: FormData) {
  await requireAdmin()

  const payload = {
    title: getRequiredString(formData, 'title'),
    description: getRequiredString(formData, 'description'),
    category: getRequiredString(formData, 'category'),
    image_url: getOptionalString(formData, 'image_url'),
    schedule_info: getOptionalString(formData, 'schedule_info'),
    is_active: getCheckboxBoolean(formData, 'is_active', true),
    order_index: getOptionalNumber(formData, 'order_index'),
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('activities').insert(payload)

  assertMutationSucceeded('activities', error)
  revalidateActivityPaths()
}

export async function updateActivity(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const payload = {
    title: getRequiredString(formData, 'title'),
    description: getRequiredString(formData, 'description'),
    category: getRequiredString(formData, 'category'),
    image_url: getOptionalString(formData, 'image_url'),
    schedule_info: getOptionalString(formData, 'schedule_info'),
    is_active: getCheckboxBoolean(formData, 'is_active'),
    order_index: getOptionalNumber(formData, 'order_index'),
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('activities').update(payload).eq('id', id)

  assertMutationSucceeded('activities', error)
  revalidateActivityPaths()
}

export async function toggleActivity(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const isActive = getCheckboxBoolean(formData, 'is_active')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('activities')
    .update({ is_active: isActive })
    .eq('id', id)

  assertMutationSucceeded('activities', error)
  revalidateActivityPaths()
}

export async function updateActivityOrder(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const orderIndex = getOptionalNumber(formData, 'order_index')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('activities')
    .update({ order_index: orderIndex })
    .eq('id', id)

  assertMutationSucceeded('activities', error)
  revalidateActivityPaths()
}

export async function deleteActivity(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const supabase = createAdminClient()
  const { error } = await supabase.from('activities').delete().eq('id', id)

  assertMutationSucceeded('activities', error)
  revalidateActivityPaths()
}

export async function createGalleryItem(formData: FormData) {
  await requireAdmin()

  const payload = {
    title: getRequiredString(formData, 'title'),
    category: getRequiredString(formData, 'category'),
    image_url: getRequiredString(formData, 'image_url'),
    is_active: getCheckboxBoolean(formData, 'is_active', true),
    order_index: getOptionalNumber(formData, 'order_index'),
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery_items').insert(payload)

  assertMutationSucceeded('gallery_items', error)
  revalidateGalleryPaths()
}

export async function updateGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const payload = {
    title: getRequiredString(formData, 'title'),
    category: getRequiredString(formData, 'category'),
    image_url: getRequiredString(formData, 'image_url'),
    is_active: getCheckboxBoolean(formData, 'is_active'),
    order_index: getOptionalNumber(formData, 'order_index'),
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery_items').update(payload).eq('id', id)

  assertMutationSucceeded('gallery_items', error)
  revalidateGalleryPaths()
}

export async function toggleGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const isActive = getCheckboxBoolean(formData, 'is_active')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gallery_items')
    .update({ is_active: isActive })
    .eq('id', id)

  assertMutationSucceeded('gallery_items', error)
  revalidateGalleryPaths()
}

export async function updateGalleryItemOrder(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const orderIndex = getOptionalNumber(formData, 'order_index')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gallery_items')
    .update({ order_index: orderIndex })
    .eq('id', id)

  assertMutationSucceeded('gallery_items', error)
  revalidateGalleryPaths()
}

export async function deleteGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = getRequiredString(formData, 'id')
  const supabase = createAdminClient()
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)

  assertMutationSucceeded('gallery_items', error)
  revalidateGalleryPaths()
}

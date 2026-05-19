import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import {
  parsePublicSiteSettings,
  type PublicSiteSettings,
  type SiteSettingRow,
} from '@/lib/site-settings'

export type SiteSettings = PublicSiteSettings

export type HomeObjective = {
  id: string
  title: string
  description: string
  icon: string | null
}

export type Professional = {
  id: string
  first_name: string
  last_name: string
  role: string
  bio: string | null
  image_url: string | null
}

export type Activity = {
  id: string
  title: string
  description: string
  category: string
  image_url: string | null
  schedule_info: string | null
}

export type Event = {
  id: string
  title: string
  slug: string
  content: string
  event_date: string | null
  cover_image_url: string | null
}

export type GalleryItem = {
  id: string
  title: string
  category: string
  image_url: string
}

type SupabaseResponse<T> = {
  data: T | null
  error: { message: string } | null
}

function assertSupabaseData<T>(
  tableName: string,
  response: SupabaseResponse<T>
): T {
  if (response.error) {
    throw new Error(`Supabase read failed for ${tableName}: ${response.error.message}`)
  }

  if (!response.data) {
    throw new Error(`Supabase read returned no data for ${tableName}`)
  }

  return response.data
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient()
  const response = await supabase
    .from('site_settings')
    .select('setting_key, setting_value, setting_type')

  const rows = assertSupabaseData(
    'site_settings',
    response as SupabaseResponse<SiteSettingRow[]>
  )

  return parsePublicSiteSettings(rows)
})

export async function getHomeObjectives(): Promise<HomeObjective[]> {
  const supabase = await createClient()
  const response = await supabase
    .from('home_objectives')
    .select('id, title, description, icon')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  return assertSupabaseData(
    'home_objectives',
    response as SupabaseResponse<HomeObjective[]>
  )
}

export async function getProfessionals(): Promise<Professional[]> {
  const supabase = await createClient()
  const response = await supabase
    .from('professionals')
    .select('id, first_name, last_name, role, bio, image_url')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  return assertSupabaseData(
    'professionals',
    response as SupabaseResponse<Professional[]>
  )
}

export async function getActivities(): Promise<Activity[]> {
  const supabase = await createClient()
  const response = await supabase
    .from('activities')
    .select('id, title, description, category, image_url, schedule_info')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  return assertSupabaseData(
    'activities',
    response as SupabaseResponse<Activity[]>
  )
}

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const response = await supabase
    .from('events')
    .select('id, title, slug, content, event_date, cover_image_url')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return assertSupabaseData('events', response as SupabaseResponse<Event[]>)
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = await createClient()
  const response = await supabase
    .from('gallery_items')
    .select('id, title, category, image_url')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  return assertSupabaseData(
    'gallery_items',
    response as SupabaseResponse<GalleryItem[]>
  )
}

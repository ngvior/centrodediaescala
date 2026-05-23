import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  createRequiredSiteSettingsRows,
  createSupabaseClientMock,
} from '@/test/supabase-test-helpers'
import { REQUIRED_SITE_SETTING_KEYS } from '@/lib/site-settings'

const apiMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  cmsMockImport: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: apiMocks.createClient,
}))

vi.mock('@/lib/cms-mock', () => {
  apiMocks.cmsMockImport()
  return {}
})

import { getActivities, getProfessionals, getSiteSettings } from './index'

describe('public data API', () => {
  beforeEach(() => {
    apiMocks.createClient.mockReset()
    apiMocks.cmsMockImport.mockReset()
  })

  it('reads site settings from Supabase and normalizes rows by setting key', async () => {
    const { client, queries } = createSupabaseClientMock([
      {
        table: 'site_settings',
        response: { data: createRequiredSiteSettingsRows(), error: null },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getSiteSettings()).resolves.toMatchObject({
      contact_phone: 'db-contact_phone',
      home_hero_title: 'db-home_hero_title',
      about_compliance_items: ['db-about_compliance_items'],
      header_navigation: [{ label: 'Inicio', href: '#inicio' }],
    })

    expect(client.from).toHaveBeenCalledWith('site_settings')
    expect(queries[0].select).toHaveBeenCalledWith(
      'setting_key, setting_value, setting_type'
    )
  })

  it('fails safely when a required site setting is missing', async () => {
    const rows = createRequiredSiteSettingsRows().filter(
      (row) => row.setting_key !== 'about_text'
    )
    const { client } = createSupabaseClientMock([
      {
        table: 'site_settings',
        response: { data: rows, error: null },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getSiteSettings()).rejects.toThrow(
      'Missing required site settings: about_text'
    )
  })

  it('fails safely when a required JSON site setting is malformed', async () => {
    const rows = createRequiredSiteSettingsRows().map((row) =>
      row.setting_key === 'about_compliance_items'
        ? { ...row, setting_value: '{broken-json' }
        : row
    )
    const { client } = createSupabaseClientMock([
      {
        table: 'site_settings',
        response: { data: rows, error: null },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getSiteSettings()).rejects.toThrow(
      'Malformed JSON site setting: about_compliance_items'
    )
  })

  it('keeps seed defaults aligned with every required setting key', () => {
    const seedSql = readFileSync(
      path.join(process.cwd(), 'supabase/seed.sql'),
      'utf8'
    )

    for (const key of REQUIRED_SITE_SETTING_KEYS) {
      expect(seedSql).toContain(`'${key}'`)
    }
  })

  it('keeps optional social seed rows aligned with the public social contract', () => {
    const seedSql = readFileSync(
      path.join(process.cwd(), 'supabase/seed.sql'),
      'utf8'
    )

    expect(seedSql).toContain("'social_facebook'")
    expect(seedSql).toContain("'social_linkedin'")
    expect(seedSql).toContain("'social_twitter'")
  })

  it('fails explicitly when Supabase returns a read error', async () => {
    const { client } = createSupabaseClientMock([
      {
        table: 'professionals',
        response: {
          data: null,
          error: { message: 'database unavailable' },
        },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getProfessionals()).rejects.toThrow(
      'Supabase read failed for professionals: database unavailable'
    )
  })

  it('fails explicitly when Supabase env validation fails', async () => {
    apiMocks.createClient.mockRejectedValue(
      new Error(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
      )
    )

    await expect(getActivities()).rejects.toThrow(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
    )
  })

  it('does not import cms-mock as a runtime fallback', async () => {
    const { client } = createSupabaseClientMock([
      {
        table: 'activities',
        response: {
          data: [
            {
              id: 'activity-from-db',
              title: 'Actividad desde DB',
              description: 'Runtime Supabase data',
              category: 'Centro de día',
              image_url: null,
              schedule_info: null,
            },
          ],
          error: null,
        },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getActivities()).resolves.toEqual([
      expect.objectContaining({ id: 'activity-from-db' }),
    ])
    expect(apiMocks.cmsMockImport).not.toHaveBeenCalled()
  })
})

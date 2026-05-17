import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createRequiredSiteSettingsRows,
  createSupabaseClientMock,
} from '@/test/supabase-test-helpers'

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
    const { client } = createSupabaseClientMock([
      {
        table: 'site_settings',
        response: { data: createRequiredSiteSettingsRows(), error: null },
      },
    ])
    apiMocks.createClient.mockResolvedValue(client)

    await expect(getSiteSettings()).resolves.toMatchObject({
      contact_phone: 'db-contact_phone',
      home_hero_title: 'db-home_hero_title',
    })

    expect(client.from).toHaveBeenCalledWith('site_settings')
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

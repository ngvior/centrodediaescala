import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NextRequest } from 'next/server'
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from 'next/experimental/testing/server'

const proxyMocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims: proxyMocks.getClaims,
    },
  })),
}))

import { config, proxy } from './proxy'

describe('admin proxy', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    proxyMocks.getClaims.mockReset()
  })

  afterEach(() => {
    delete process.env.ADMIN_EMAIL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it.each([
    '/admin/configuracion',
    '/admin/actividades',
    '/admin/galeria',
    '/admin/entrevistas',
  ])('redirects a non-admin away from %s', async (adminPath) => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: adminPath,
      })
    ).toBe(true)

    proxyMocks.getClaims.mockResolvedValue({
      data: { claims: { email: 'visitor@example.com' } },
      error: null,
    })

    const response = await proxy(new NextRequest(`https://example.com${adminPath}`))

    expect(response.status).toBe(307)
    expect(getRedirectUrl(response)).toBe('https://example.com/admin/login')
  })
})

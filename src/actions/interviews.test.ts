import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFormData } from '@/test/supabase-test-helpers'

const actionMocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: actionMocks.createAdminClient,
}))

vi.mock('next/headers', () => ({
  headers: actionMocks.headers,
}))

vi.mock('next/cache', () => ({
  revalidatePath: actionMocks.revalidatePath,
}))

import {
  submitInterviewRequest,
  type InterviewSubmissionState,
} from './interviews'

const initialState: InterviewSubmissionState = { status: 'idle', message: '' }
const originalEnv = process.env

function createInterviewFormData(
  overrides: Record<string, string | number | null> = {}
) {
  return createFormData({
    contact_name: 'Ada Lovelace',
    patient_name: 'Grace Hopper',
    phone: '11 5555-5555',
    email: 'ada@example.com',
    message: 'Quiero coordinar una entrevista.',
    company_website: null,
    ...overrides,
  })
}

function mockHeaders(values: Record<string, string | null>) {
  actionMocks.headers.mockResolvedValue({
    get: vi.fn((name: string) => values[name.toLowerCase()] ?? null),
  })
}

function createInterviewClientMock({
  rateLimitAllowed = true,
  rpcError = null,
  insertError = null,
}: {
  rateLimitAllowed?: boolean
  rpcError?: { message: string } | null
  insertError?: { message: string } | null
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError })
  const from = vi.fn(() => ({ insert }))
  const rpc = vi.fn().mockResolvedValue({
    data: [{ allowed: rateLimitAllowed, request_count: rateLimitAllowed ? 1 : 4 }],
    error: rpcError,
  })

  return { client: { from, rpc }, from, insert, rpc }
}

describe('interview actions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T12:34:56.000Z'))
    process.env = {
      ...originalEnv,
      RATE_LIMIT_SECRET: 'stable-test-secret',
      INTERVIEW_RATE_LIMIT_MAX: '3',
      INTERVIEW_RATE_LIMIT_WINDOW_MINUTES: '60',
    }
    actionMocks.createAdminClient.mockReset()
    actionMocks.headers.mockReset()
    actionMocks.revalidatePath.mockReset()
    mockHeaders({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' })
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env = originalEnv
  })

  it('inserts a valid request through the server-only admin client after rate limiting', async () => {
    const { client, from, insert, rpc } = createInterviewClientMock()
    actionMocks.createAdminClient.mockReturnValue(client)

    await expect(
      submitInterviewRequest(initialState, createInterviewFormData())
    ).resolves.toMatchObject({ status: 'success' })

    expect(actionMocks.headers).toHaveBeenCalledTimes(1)
    expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('increment_interview_rate_limit', {
      p_ip_hash: expect.not.stringContaining('203.0.113.1'),
      p_window_start: '2026-05-16T12:00:00.000Z',
      p_max_requests: 3,
    })
    expect(from).toHaveBeenCalledWith('interview_requests')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_name: 'Ada Lovelace',
        patient_name: 'Grace Hopper',
        phone: '11 5555-5555',
        email: 'ada@example.com',
      })
    )
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('fails open to the default rate-limit max when INTERVIEW_RATE_LIMIT_MAX is malformed', async () => {
    process.env.INTERVIEW_RATE_LIMIT_MAX = '3x'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { client, rpc } = createInterviewClientMock()
    actionMocks.createAdminClient.mockReturnValue(client)

    await expect(
      submitInterviewRequest(initialState, createInterviewFormData())
    ).resolves.toMatchObject({ status: 'success' })

    expect(rpc).toHaveBeenCalledWith(
      'increment_interview_rate_limit',
      expect.objectContaining({ p_max_requests: 3 })
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('INTERVIEW_RATE_LIMIT_MAX')
    )

    warnSpy.mockRestore()
  })

  it('returns validation feedback without creating a Supabase client for invalid payloads', async () => {
    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData({ contact_name: '', phone: '' })
    )

    expect(result).toMatchObject({
      status: 'error',
      fieldErrors: {
        contact_name: 'Ingresá el nombre de contacto.',
        phone: 'Ingresá un teléfono de contacto.',
      },
    })
    expect(actionMocks.headers).not.toHaveBeenCalled()
    expect(actionMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns a benign success for honeypot submissions before rate-limit work', async () => {
    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData({ company_website: 'https://bot.example' })
    )

    expect(result.status).toBe('success')
    expect(actionMocks.headers).not.toHaveBeenCalled()
    expect(actionMocks.createAdminClient).not.toHaveBeenCalled()
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('does not insert and returns a friendly message when the RPC denies the request', async () => {
    const { client, from } = createInterviewClientMock({ rateLimitAllowed: false })
    actionMocks.createAdminClient.mockReturnValue(client)

    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData()
    )

    expect(result).toMatchObject({
      status: 'error',
      message:
        'Recibimos muchas solicitudes desde esta conexión. Probá de nuevo más tarde o comunicate por teléfono.',
    })
    expect(from).not.toHaveBeenCalled()
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('fails safely without rate-limit or insert work when RATE_LIMIT_SECRET is missing', async () => {
    delete process.env.RATE_LIMIT_SECRET

    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData()
    )

    expect(result).toMatchObject({ status: 'error' })
    expect(actionMocks.headers).not.toHaveBeenCalled()
    expect(actionMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('fails safely when the Supabase admin client cannot be created', async () => {
    actionMocks.createAdminClient.mockImplementation(() => {
      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
    })

    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData()
    )

    expect(result).toMatchObject({ status: 'error' })
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('returns the safe error message and logs without PII when an unexpected error occurs', async () => {
    actionMocks.createAdminClient.mockImplementation(() => {
      throw new Error('db connection lost')
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await submitInterviewRequest(
      initialState,
      createInterviewFormData()
    )

    expect(result).toMatchObject({
      status: 'error',
      message: 'No pudimos enviar la solicitud en este momento. Probá nuevamente más tarde.',
    })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const loggedContext = errorSpy.mock.calls[0][1] as Record<string, unknown>
    expect(typeof loggedContext.error).toBe('string')
    const loggedStr = JSON.stringify(loggedContext)
    expect(loggedStr).not.toContain('Ada Lovelace')
    expect(loggedStr).not.toContain('11 5555-5555')
    expect(loggedStr).not.toContain('ada@example.com')
    expect(loggedStr).not.toContain('Quiero coordinar una entrevista.')

    errorSpy.mockRestore()
  })

  it('fails open to the default rate-limit window when INTERVIEW_RATE_LIMIT_WINDOW_MINUTES is malformed', async () => {
    process.env.INTERVIEW_RATE_LIMIT_WINDOW_MINUTES = '60x'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { client, rpc } = createInterviewClientMock()
    actionMocks.createAdminClient.mockReturnValue(client)

    await expect(
      submitInterviewRequest(initialState, createInterviewFormData())
    ).resolves.toMatchObject({ status: 'success' })

    expect(rpc).toHaveBeenCalledWith(
      'increment_interview_rate_limit',
      expect.objectContaining({ p_window_start: '2026-05-16T12:00:00.000Z' })
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('INTERVIEW_RATE_LIMIT_WINDOW_MINUTES')
    )

    warnSpy.mockRestore()
  })

  it('fails open to the default rate-limit max when INTERVIEW_RATE_LIMIT_MAX is zero or negative', async () => {
    process.env.INTERVIEW_RATE_LIMIT_MAX = '0'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { client, rpc } = createInterviewClientMock()
    actionMocks.createAdminClient.mockReturnValue(client)

    await expect(
      submitInterviewRequest(initialState, createInterviewFormData())
    ).resolves.toMatchObject({ status: 'success' })

    expect(rpc).toHaveBeenCalledWith(
      'increment_interview_rate_limit',
      expect.objectContaining({ p_max_requests: 3 })
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('INTERVIEW_RATE_LIMIT_MAX')
    )

    warnSpy.mockRestore()
  })
})

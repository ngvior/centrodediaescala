import { Children, isValidElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminInterviewRequest } from '@/actions/admin'

const pageMocks = vi.hoisted(() => ({
  deleteInterviewRequest: vi.fn(),
  getAdminInterviewRequests: vi.fn(),
  updateInterviewRequestCrm: vi.fn(),
}))

vi.mock('@/actions/admin', () => ({
  deleteInterviewRequest: pageMocks.deleteInterviewRequest,
  getAdminInterviewRequests: pageMocks.getAdminInterviewRequests,
  updateInterviewRequestCrm: pageMocks.updateInterviewRequestCrm,
}))

import EntrevistasPage from './page'
import { formatInterviewDateLabel, normalizeStatusFilter } from './page-helpers'

function getElementChildren(node: ReactNode) {
  if (!isValidElement(node)) {
    return []
  }

  return Children.toArray((node.props as { children?: ReactNode }).children)
}

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('')
  }

  if (isValidElement(node)) {
    return getElementChildren(node).map(getTextContent).join('')
  }

  return ''
}

function findElementsByTypeName(root: ReactNode, typeName: string) {
  const matches: ReactNode[] = []
  const queue = [root]

  while (queue.length > 0) {
    const current = queue.shift()

    if (!isValidElement(current)) {
      continue
    }

    if (typeof current.type === 'function' && current.type.name === typeName) {
      matches.push(current)
    }

    queue.push(...getElementChildren(current))
  }

  return matches
}

function createInterviewRequest(overrides: Partial<AdminInterviewRequest> = {}): AdminInterviewRequest {
  return {
    id: 'request-1',
    contact_name: 'Ada Lovelace',
    patient_name: 'Paciente Test',
    phone: '1122334455',
    email: 'ada@example.com',
    message: 'Quiero coordinar una entrevista.',
    status: 'PENDING',
    notes: null,
    created_at: '2026-05-19T10:00:00.000Z',
    ...overrides,
  }
}

function getInterviewsAdminProps(page: ReactNode) {
  const islands = findElementsByTypeName(page, 'InterviewsAdmin')

  expect(islands).toHaveLength(1)

  return (islands[0] as { props: Record<string, unknown> }).props
}

describe('EntrevistasPage', () => {
  it('fetches every request and delegates rendering to the client island', async () => {
    const request = createInterviewRequest()
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([request])

    const page = await EntrevistasPage({ searchParams: Promise.resolve({}) })
    const props = getInterviewsAdminProps(page)

    expect(pageMocks.getAdminInterviewRequests).toHaveBeenCalledWith()
    expect(getTextContent(page)).toContain('Entrevistas')
    expect(props.initialStatus).toBeNull()
    expect(props.requests).toEqual([
      {
        ...request,
        // 10:00 UTC on 2026-05-19 is 07:00 in Buenos Aires.
        dateLabel: 'Recibida el 19/05/2026 · 07:00 a.m.',
      },
    ])
  })

  it('passes an empty list to the island when there are no requests', async () => {
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([])

    const page = await EntrevistasPage({ searchParams: Promise.resolve({}) })
    const props = getInterviewsAdminProps(page)

    expect(props.requests).toEqual([])
    expect(props.initialStatus).toBeNull()
  })

  it('preselects the filter from a valid ?status= deep link', async () => {
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([])

    const page = await EntrevistasPage({
      searchParams: Promise.resolve({ status: 'PENDING' }),
    })

    expect(getInterviewsAdminProps(page).initialStatus).toBe('PENDING')
  })

  it('ignores invalid ?status= values instead of filtering server-side', async () => {
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([])

    const page = await EntrevistasPage({
      searchParams: Promise.resolve({ status: 'ARCHIVED' }),
    })

    expect(pageMocks.getAdminInterviewRequests).toHaveBeenCalledWith()
    expect(getInterviewsAdminProps(page).initialStatus).toBeNull()
  })
})

describe('normalizeStatusFilter', () => {
  it('accepts every known interview status', () => {
    expect(normalizeStatusFilter('PENDING')).toBe('PENDING')
    expect(normalizeStatusFilter('CONTACTED')).toBe('CONTACTED')
    expect(normalizeStatusFilter('CONFIRMED')).toBe('CONFIRMED')
    expect(normalizeStatusFilter('REJECTED')).toBe('REJECTED')
  })

  it('takes the first value of repeated params', () => {
    expect(normalizeStatusFilter(['CONTACTED', 'PENDING'])).toBe('CONTACTED')
  })

  it('rejects unknown, empty and missing values', () => {
    expect(normalizeStatusFilter('ARCHIVED')).toBeUndefined()
    expect(normalizeStatusFilter('pending')).toBeUndefined()
    expect(normalizeStatusFilter('')).toBeUndefined()
    expect(normalizeStatusFilter(undefined)).toBeUndefined()
    expect(normalizeStatusFilter([])).toBeUndefined()
  })
})

describe('formatInterviewDateLabel', () => {
  // 12:00 (noon) in Buenos Aires (UTC-3) on 2026-07-13.
  const now = new Date('2026-07-13T15:00:00.000Z')

  it('labels requests received the same Buenos Aires calendar day as "hoy"', () => {
    expect(formatInterviewDateLabel('2026-07-13T12:14:00.000Z', now)).toBe(
      'Recibida hoy · 09:14 a.m.'
    )
  })

  it('labels the previous calendar day as "ayer" with a 12-hour p.m. time', () => {
    expect(formatInterviewDateLabel('2026-07-12T21:02:00.000Z', now)).toBe(
      'Recibida ayer · 06:02 p.m.'
    )
  })

  it('compares calendar days in the Buenos Aires timezone, not UTC', () => {
    // 01:00 UTC on the 13th is still 22:00 of the 12th in Buenos Aires.
    expect(formatInterviewDateLabel('2026-07-13T01:00:00.000Z', now)).toBe(
      'Recibida ayer · 10:00 p.m.'
    )
  })

  it('falls back to a dd/mm/yyyy label for older requests', () => {
    expect(formatInterviewDateLabel('2026-07-05T14:30:00.000Z', now)).toBe(
      'Recibida el 05/07/2026 · 11:30 a.m.'
    )
  })

  it('keeps the 12-hour clock with leading zeros around midnight', () => {
    expect(formatInterviewDateLabel('2026-07-13T03:05:00.000Z', now)).toBe(
      'Recibida hoy · 12:05 a.m.'
    )
  })
})

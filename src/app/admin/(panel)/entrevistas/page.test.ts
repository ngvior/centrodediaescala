import { Children, isValidElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminInterviewRequest } from '@/actions/admin'

const pageMocks = vi.hoisted(() => ({
  getAdminInterviewRequests: vi.fn(),
  updateInterviewRequestCrm: vi.fn(),
}))

vi.mock('@/actions/admin', () => ({
  getAdminInterviewRequests: pageMocks.getAdminInterviewRequests,
  updateInterviewRequestCrm: pageMocks.updateInterviewRequestCrm,
}))

import EntrevistasPage from './page'

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

describe('EntrevistasPage', () => {
  it('renders the empty state when no interview requests exist', async () => {
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([])

    const page = await EntrevistasPage({ searchParams: Promise.resolve({}) })

    expect(pageMocks.getAdminInterviewRequests).toHaveBeenCalledWith(undefined)
    expect(getTextContent(page)).toContain('No hay solicitudes de entrevista para mostrar.')
  })

  it('renders interview request cards for non-empty results', async () => {
    const request = createInterviewRequest()
    pageMocks.getAdminInterviewRequests.mockResolvedValueOnce([request])

    const page = await EntrevistasPage({
      searchParams: Promise.resolve({ status: 'PENDING' }),
    })

    const requestCards = findElementsByTypeName(page, 'InterviewRequestCard')

    expect(pageMocks.getAdminInterviewRequests).toHaveBeenCalledWith('PENDING')
    expect(getTextContent(page)).not.toContain('No hay solicitudes de entrevista para mostrar.')
    expect(requestCards).toHaveLength(1)
    expect(requestCards[0]).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({ request }),
      })
    )
  })
})

import { describe, expect, it, vi } from 'vitest'

// interviews-admin imports the server actions module; stub it so importing the
// island never touches Supabase or next/cache in the test environment.
vi.mock('@/actions/admin', () => ({
  deleteInterviewRequest: vi.fn(),
  updateInterviewRequestCrm: vi.fn(),
}))

import { getInitials } from './interviews-admin'

describe('getInitials', () => {
  it('takes the first two letters of the first word, uppercased', () => {
    expect(getInitials('Martina')).toBe('MA')
    expect(getInitials('bruno diaz')).toBe('BR')
  })

  it('handles accented and non-ASCII first letters', () => {
    expect(getInitials('Sofía')).toBe('SO')
    expect(getInitials('ñandú corp')).toBe('ÑA')
  })

  it('ignores leading whitespace', () => {
    expect(getInitials('  Nicolás')).toBe('NI')
  })

  it('keeps a single letter when the first word has only one', () => {
    expect(getInitials('a')).toBe('A')
  })

  it('falls back to "?" for empty or blank names', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
  })
})

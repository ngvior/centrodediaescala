import { Children, isValidElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/actions/auth', () => ({
  logoutAdmin: vi.fn(),
}))

import AdminLayout from './layout'

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

function findElementByHref(root: ReactNode, href: string): ReactNode | undefined {
  const queue = [root]

  while (queue.length > 0) {
    const current = queue.shift()

    if (!isValidElement(current)) {
      continue
    }

    if ((current.props as { href?: string }).href === href) {
      return current
    }

    queue.push(...getElementChildren(current))
  }

  return undefined
}

describe('AdminLayout', () => {
  it.each([
    { href: '/admin/configuracion', label: 'Configuración' },
    { href: '/admin/actividades', label: 'Actividades' },
    { href: '/admin/galeria', label: 'Galería' },
    { href: '/admin/entrevistas', label: 'Entrevistas' },
  ])('renders the %s CMS navigation link', ({ href, label }) => {
    const layout = AdminLayout({ children: null })
    const link = findElementByHref(layout, href)

    expect(link).toBeDefined()
    expect(getTextContent(link)).toContain(label)
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('public footer social-link integration', () => {
  it('accepts normalized socialLinks instead of a single Facebook setting', () => {
    const footerSource = readSource('src/components/layout/footer.tsx')

    expect(footerSource).toContain('socialLinks')
    expect(footerSource).toContain('PublicSocialLink')
    expect(footerSource).not.toContain('socialFacebook')
  })

  it('renders safe accessible external social links with visible focus styles', () => {
    const footerSource = readSource('src/components/layout/footer.tsx')

    expect(footerSource).toContain('aria-label')
    expect(footerSource).toContain('target="_blank"')
    expect(footerSource).toContain('rel="noopener noreferrer"')
    expect(footerSource).toContain('focus-visible')
    expect(footerSource).toContain('text-[#cccccc]')
  })

  it('normalizes public layout social settings before rendering the footer', () => {
    const layoutSource = readSource('src/app/(public)/layout.tsx')

    expect(layoutSource).toContain('getPublicSocialLinks')
    expect(layoutSource).toContain('settings.social_facebook')
    expect(layoutSource).toContain('settings.social_linkedin')
    expect(layoutSource).toContain('settings.social_twitter')
    expect(layoutSource).toContain('socialLinks={socialLinks}')
  })
})

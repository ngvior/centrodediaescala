import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  QUOTE_BAND_BACKGROUND_IMAGE,
  QUOTE_BAND_TEXT,
} from './QuoteBand'

const PUBLIC_UI_SOURCE_FILES = [
  'src/app/(public)/page.tsx',
  'src/app/globals.css',
  'src/components/sections/GallerySection.tsx',
  'src/components/interview-request-form.tsx',
  'src/components/layout/footer.tsx',
]

describe('QuoteBand legacy design-system parity', () => {
  it('exports the approved quote text and background image contract', () => {
    expect(QUOTE_BAND_TEXT).toBe(
      'Nosotros mismos debemos ser el cambio que deseamos ver en el mundo'
    )
    expect(QUOTE_BAND_BACKGROUND_IMAGE).toBe('/poligan_bg.jpg')
  })

  it('does not hardcode low-contrast #888888 text in public UI source paths', () => {
    for (const file of PUBLIC_UI_SOURCE_FILES) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8')

      expect(source, file).not.toContain('text-[#888888]')
      expect(source, file).not.toContain('#888888')
    }
  })

  it('inserts QuoteBand after the gallery and before the team section', () => {
    const pageSource = readFileSync(
      path.join(process.cwd(), 'src/app/(public)/page.tsx'),
      'utf8'
    )

    expect(pageSource).toContain('import { QuoteBand }')
    expect(pageSource.indexOf('<GallerySection')).toBeGreaterThan(-1)
    expect(pageSource.indexOf('<QuoteBand />')).toBeGreaterThan(
      pageSource.indexOf('<GallerySection')
    )
    expect(pageSource.indexOf('<QuoteBand />')).toBeLessThan(
      pageSource.indexOf('id="equipo"')
    )
  })
})

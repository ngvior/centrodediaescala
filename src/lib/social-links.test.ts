import { describe, expect, it } from 'vitest'

import { getPublicSocialLinks } from './social-links'

describe('getPublicSocialLinks', () => {
  it('returns valid Facebook, LinkedIn, and Twitter URLs in deterministic platform order', () => {
    expect(
      getPublicSocialLinks({
        twitter: ' https://twitter.com/centrodediaescala ',
        linkedin: 'https://www.linkedin.com/company/centro-de-dia-escala',
        facebook: 'https://www.facebook.com/centrodediaescala',
      })
    ).toEqual([
      {
        platform: 'facebook',
        label: 'Facebook',
        url: 'https://www.facebook.com/centrodediaescala',
      },
      {
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/company/centro-de-dia-escala',
      },
      {
        platform: 'twitter',
        label: 'Twitter/X',
        url: 'https://twitter.com/centrodediaescala',
      },
    ])
  })

  it('hides empty strings', () => {
    expect(
      getPublicSocialLinks({
        facebook: '',
        linkedin: '   ',
        twitter: '',
      })
    ).toEqual([])
  })

  it('hides malformed URLs and unsafe protocols', () => {
    expect(
      getPublicSocialLinks({
        facebook: 'not a url',
        linkedin: 'javascript:alert(1)',
        twitter: 'data:text/html,<script>alert(1)</script>',
      })
    ).toEqual([])
  })

  it('does not represent unsupported or deprecated Google+ input in public output', () => {
    const links = getPublicSocialLinks({
      facebook: '',
      linkedin: '',
      twitter: '',
      googlePlus: 'https://plus.google.com/centrodediaescala',
    } as never)

    expect(links).toEqual([])
    expect(links.map((link) => link.platform)).not.toContain('googlePlus')
  })

  it('accepts valid x.com URLs for the Twitter/X platform', () => {
    expect(
      getPublicSocialLinks({
        facebook: '',
        linkedin: '',
        twitter: 'https://x.com/centrodediaescala',
      })
    ).toEqual([
      {
        platform: 'twitter',
        label: 'Twitter/X',
        url: 'https://x.com/centrodediaescala',
      },
    ])
  })

  it('hides URLs whose host does not match the configured platform', () => {
    expect(
      getPublicSocialLinks({
        facebook: 'https://www.linkedin.com/company/centro-de-dia-escala',
        linkedin: 'https://www.facebook.com/centrodediaescala',
        twitter: 'https://example.com/centrodediaescala',
      })
    ).toEqual([])
  })
})

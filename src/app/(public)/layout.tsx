import { ReactNode } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getSiteSettings } from '@/lib/api'
import { getPublicSocialLinks } from '@/lib/social-links'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  const socialLinks = getPublicSocialLinks({
    facebook: settings.social_facebook,
    linkedin: settings.social_linkedin,
    twitter: settings.social_twitter,
  })

  return (
    <>
      <Header
        brandName={settings.brand_name}
        brandSubtitle={settings.brand_subtitle}
        navigation={settings.header_navigation}
      />
      <main className="flex-1 pt-20">{children}</main>
      <Footer
        brandName={settings.brand_name}
        copyrightText={settings.footer_copyright}
        socialLinks={socialLinks}
      />
    </>
  )
}

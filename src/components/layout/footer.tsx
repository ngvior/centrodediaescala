import { Globe } from 'lucide-react'

import type { PublicSocialLink, SocialPlatform } from '@/lib/social-links'

const socialLinkClasses: Record<SocialPlatform, string> = {
  facebook: 'hover:bg-[#1877f2] focus-visible:ring-[#1877f2]',
  linkedin: 'hover:bg-[#0a66c2] focus-visible:ring-[#0a66c2]',
  twitter: 'hover:bg-[#111111] focus-visible:ring-white/80',
}

export function Footer({
  brandName,
  copyrightText,
  socialLinks,
}: {
  brandName: string
  copyrightText: string
  socialLinks: PublicSocialLink[]
}) {
  return (
    <footer className="border-t border-[#111111] bg-[#222222] text-[#cccccc]">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 text-center md:mb-0 md:text-left">
            <span className="font-bold text-white">{brandName}</span> | {copyrightText} ©{' '}
            {new Date().getFullYear()}
          </div>
          {socialLinks.length > 0 ? (
            <div className="flex gap-4" aria-label="Redes sociales">
              {socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visitar ${link.label}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#222222] ${socialLinkClasses[link.platform]}`}
                >
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

import { Globe } from "lucide-react";

export function Footer({
  brandName,
  copyrightText,
  socialFacebook,
}: {
  brandName: string
  copyrightText: string
  socialFacebook: string
}) {
  return (
    <footer className="bg-[#222222] text-[#888888] border-t border-[#111111]">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <span className="text-white font-bold">{brandName}</span> | {copyrightText} © {new Date().getFullYear()}
          </div>
          <div className="flex gap-4">
            <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#111111] hover:bg-primary text-white rounded-full flex items-center justify-center transition-colors">
              <Globe className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getSiteSettings } from "@/lib/api";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();

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
        socialFacebook={settings.social_facebook}
      />
    </>
  );
}

import { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getSiteSettings } from "@/lib/api";
import { getPublicSocialLinks } from "@/lib/social-links";

export default async function PublicLayout({
	children,
}: {
	children: ReactNode;
}) {
	const settings = await getSiteSettings();
	const socialLinks = getPublicSocialLinks({
		facebook: settings.social_facebook,
		instagram: settings.social_instagram,
		linkedin: settings.social_linkedin,
		twitter: settings.social_twitter,
	});
	const contactSummary = `${settings.contact_phone} - ${settings.contact_schedule} - ${settings.contact_address}`;

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
				contactSummary={contactSummary}
				socialLinks={socialLinks}
			/>
		</>
	);
}

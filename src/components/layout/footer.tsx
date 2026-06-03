import type { PublicSocialLink, SocialPlatform } from "@/lib/social-links";

const socialLinkClasses: Record<SocialPlatform, string> = {
	facebook: "hover:bg-[#1877f2] focus-visible:ring-[#1877f2]",
	instagram: "hover:bg-[#e4405f] focus-visible:ring-[#e4405f]",
	linkedin: "hover:bg-[#0a66c2] focus-visible:ring-[#0a66c2]",
	twitter: "hover:bg-[#111111] focus-visible:ring-white/80",
};

function SocialIcon({ platform }: { platform: SocialPlatform }) {
	switch (platform) {
		case "facebook":
			return (
				<span
					aria-hidden="true"
					className="text-[18px] font-black leading-none"
				>
					f
				</span>
			);
		case "instagram":
			return (
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
				>
					<rect x="4.5" y="4.5" width="15" height="15" rx="4" />
					<circle cx="12" cy="12" r="3.4" />
					<circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
				</svg>
			);
		case "linkedin":
			return (
				<span
					aria-hidden="true"
					className="text-[14px] font-black leading-none"
				>
					in
				</span>
			);
		case "twitter":
			return (
				<span
					aria-hidden="true"
					className="text-[16px] font-black leading-none"
				>
					X
				</span>
			);
		default:
			return null;
	}
}

export function Footer({
	brandName,
	copyrightText,
	contactSummary,
	socialLinks,
}: {
	brandName: string;
	copyrightText: string;
	contactSummary: string;
	socialLinks: PublicSocialLink[];
}) {
	return (
		<footer className="border-t border-[#111111] bg-[#222222] text-[#cccccc]">
			<div className="container mx-auto px-4 py-8 md:px-6">
				<div className="flex flex-col items-center justify-between md:flex-row">
					<div className="mb-4 text-center md:mb-0 md:text-left">
						<div>
							<span className="font-bold text-white">{brandName}</span> |{" "}
							{copyrightText} © {new Date().getFullYear()}
						</div>
						<p className="mt-2 text-sm leading-6 text-[#cccccc]">
							{contactSummary}
						</p>
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
									<SocialIcon platform={link.platform} />
								</a>
							))}
						</div>
					) : null}
				</div>
			</div>
		</footer>
	);
}

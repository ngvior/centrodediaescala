export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter";

export type PublicSocialLinksConfig = {
	facebook: string;
	instagram: string;
	linkedin: string;
	twitter: string;
};

export type PublicSocialLink = {
	platform: SocialPlatform;
	label: string;
	url: string;
};

type PlatformDefinition = {
	platform: SocialPlatform;
	configKey: keyof PublicSocialLinksConfig;
	label: string;
	allowedHosts: Set<string>;
};

const PLATFORM_DEFINITIONS: PlatformDefinition[] = [
	{
		platform: "facebook",
		configKey: "facebook",
		label: "Facebook",
		allowedHosts: new Set(["facebook.com", "www.facebook.com"]),
	},
	{
		platform: "instagram",
		configKey: "instagram",
		label: "Instagram",
		allowedHosts: new Set(["instagram.com", "www.instagram.com"]),
	},
	{
		platform: "linkedin",
		configKey: "linkedin",
		label: "LinkedIn",
		allowedHosts: new Set(["linkedin.com", "www.linkedin.com"]),
	},
	{
		platform: "twitter",
		configKey: "twitter",
		label: "Twitter/X",
		allowedHosts: new Set([
			"twitter.com",
			"www.twitter.com",
			"x.com",
			"www.x.com",
		]),
	},
];

function isSafePlatformUrl(url: string, allowedHosts: Set<string>) {
	try {
		const parsedUrl = new URL(url);
		return (
			parsedUrl.protocol === "https:" &&
			allowedHosts.has(parsedUrl.hostname.toLowerCase())
		);
	} catch {
		return false;
	}
}

export function getPublicSocialLinks(
	config: PublicSocialLinksConfig,
): PublicSocialLink[] {
	return PLATFORM_DEFINITIONS.flatMap((definition) => {
		const url = config[definition.configKey].trim();

		if (!url || !isSafePlatformUrl(url, definition.allowedHosts)) {
			return [];
		}

		return [
			{
				platform: definition.platform,
				label: definition.label,
				url,
			},
		];
	});
}

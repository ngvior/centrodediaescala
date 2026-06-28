import { Heart, Music, Pencil, Store, ThumbsUp, type LucideIcon } from "lucide-react";

/**
 * Single source of truth for the activity icon set.
 *
 * The public site (src/app/(public)/page.tsx) and the admin activities form
 * (ActivityIconField/Preview) both consume this map so the slug -> lucide
 * relationship and the Spanish labels never drift apart.
 */
export const ACTIVITY_ICON_SLUGS = [
	"heart",
	"thumbs-up",
	"music",
	"shop",
	"pencil",
] as const;

export type ActivityIconSlug = (typeof ACTIVITY_ICON_SLUGS)[number];

export type ActivityIconOption = {
	slug: ActivityIconSlug;
	label: string;
	Icon: LucideIcon;
};

export const ACTIVITY_ICONS: ActivityIconOption[] = [
	{ slug: "heart", label: "Corazón", Icon: Heart },
	{ slug: "thumbs-up", label: "Pulgar arriba", Icon: ThumbsUp },
	{ slug: "music", label: "Música", Icon: Music },
	{ slug: "shop", label: "Tienda / ocupacional", Icon: Store },
	{ slug: "pencil", label: "Lápiz", Icon: Pencil },
];

const ICON_BY_SLUG = new Map(ACTIVITY_ICONS.map((option) => [option.slug, option]));

export function isActivityIconSlug(value: string): value is ActivityIconSlug {
	return ICON_BY_SLUG.has(value as ActivityIconSlug);
}

/**
 * Resolves a stored icon slug to its lucide component, falling back to Heart
 * for null/unknown values (mirrors the legacy public-site behavior).
 */
export function getActivityIcon(slug: string | null | undefined): LucideIcon {
	if (!slug) {
		return Heart;
	}

	return ICON_BY_SLUG.get(slug as ActivityIconSlug)?.Icon ?? Heart;
}

export function getActivityIconLabel(slug: string): string {
	return ICON_BY_SLUG.get(slug as ActivityIconSlug)?.label ?? slug;
}

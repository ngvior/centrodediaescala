/**
 * Builds the public gallery's filter chips and decides which photos each one
 * shows.
 *
 * Both rules live here rather than in the section component for one reason: the
 * test runner is node-environment and never renders a component, so logic left
 * inside the `.tsx` is logic no test can reach. The section is a shell over
 * these two functions.
 *
 * Matching is by category identity, never by name. A name is text an admin can
 * rewrite at will; treating it as an identity is what let a rename silently
 * empty its own chip, which is the defect this module exists to make
 * unrepresentable.
 */

import type { GalleryCategory } from "@/lib/gallery-category";

/**
 * Label of last resort for the catch-all chip.
 *
 * `gallery_all_filter_label` is registered as NOT required, because a missing
 * required setting aborts the whole public settings parse and would take the
 * homepage down with it. That leaves two ways to arrive here with nothing to
 * render: no row at all, and a row that exists but is blank — a not-required
 * setting resolves an empty value to `""`. The fallback therefore covers the
 * value, not only its absence.
 */
export const DEFAULT_GALLERY_ALL_FILTER_LABEL = "Todas";

export type GalleryFilterChip = {
	/** The chip's category, or `null` on the catch-all, which binds to none. */
	id: string | null;
	label: string;
};

/**
 * The catch-all chip first, then one chip per category in the order given.
 *
 * Order is the caller's: the read already sorted by ascending `order_index`,
 * and re-sorting here would be a second, divergent opinion about chip order.
 */
export function buildGalleryFilterChips(
	categories: readonly GalleryCategory[],
	allFilterLabel: string,
): GalleryFilterChip[] {
	return [
		{
			id: null,
			label: allFilterLabel.trim() || DEFAULT_GALLERY_ALL_FILTER_LABEL,
		},
		...categories.map((category) => ({
			id: category.id,
			label: category.name,
		})),
	];
}

/**
 * `null` is the catch-all and selects everything, including photos bound to no
 * category at all. An id selects only the photos bound to that exact category.
 *
 * A photo whose category is inactive has no chip to match — the read filtered
 * that category out — so it stays visible and is reachable under the catch-all
 * only. That is what the deactivate dialog's keep option promises.
 */
export function filterByCategoryId<T extends { category_id: string | null }>(
	items: readonly T[],
	categoryId: string | null,
): T[] {
	if (categoryId === null) {
		return [...items];
	}

	return items.filter((item) => item.category_id === categoryId);
}

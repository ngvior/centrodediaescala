/**
 * Resolves the category a gallery photo is presented under.
 *
 * A photo carries two sources: the `gallery_categories` record it is bound to,
 * and the free text that predates that table. Both exist during the migration
 * to managed categories, so the rules for choosing between them live here —
 * pure, testable, and in one place rather than spread through the read path.
 */

export type GalleryCategoryEmbed = {
	name: string;
	is_active: boolean;
};

/**
 * One row of the public gallery read, with its category LEFT-joined.
 *
 * `gallery_categories` is null whenever the reader cannot see the record: the
 * item is unbound, or the category is inactive and anon RLS filtered it out.
 * That is an absent object, not an error — the join must never be `!inner`,
 * which would drop the item from the gallery entirely.
 */
export type GalleryItemJoinRow = {
	id: string;
	title: string;
	category: string | null;
	category_id: string | null;
	image_url: string;
	width: number | null;
	height: number | null;
	gallery_categories: GalleryCategoryEmbed | null;
};

export type GalleryItem = {
	id: string;
	title: string;
	/**
	 * The resolved category, never null: GallerySection lowercases it to match a
	 * filter chip. An empty string matches no chip, so a photo with no category
	 * at all appears only under the catch-all.
	 */
	category: string;
	category_id: string | null;
	image_url: string;
	/**
	 * Dimensions of the stored image, null for rows created before the browser
	 * started capturing them. The public grid needs them to reserve the right box
	 * before the photo decodes; without them it falls back to a nominal ratio and
	 * the section shifts as images load.
	 */
	width: number | null;
	height: number | null;
};

/**
 * Bound record first, legacy text second.
 *
 * The `is_active` check is deliberately explicit rather than left to RLS. The
 * policy already hides inactive categories from anon, but the server role sees
 * every row, and an archived category must not resurface as a photo's label
 * just because the caller is privileged.
 */
function resolveCategory(row: GalleryItemJoinRow): string {
	const embedded = row.gallery_categories;

	if (embedded && embedded.is_active) {
		return embedded.name.trim();
	}

	return row.category?.trim() ?? "";
}

export function toGalleryItem(row: GalleryItemJoinRow): GalleryItem {
	return {
		id: row.id,
		title: row.title,
		category: resolveCategory(row),
		category_id: row.category_id,
		image_url: row.image_url,
		width: row.width,
		height: row.height,
	};
}

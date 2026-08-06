/**
 * Paging arithmetic for the public gallery.
 *
 * Split out of the component because this is the part that decides what the
 * visitor sees, and it is worth testing without a browser. The gallery pages
 * rather than accumulating so the section keeps a bounded height no matter how
 * many photos the admin loads.
 */

/**
 * Items per page. Divisible by both column counts (`columns-2` on mobile,
 * `md:columns-4` above), which is what keeps the section roughly the same height
 * at every breakpoint: halving the columns doubles the depth but also halves the
 * column width, so each image is proportionally shorter and the two cancel out.
 */
export const GALLERY_PAGE_SIZE = 12;

export function getPageCount(
	total: number,
	pageSize: number = GALLERY_PAGE_SIZE,
): number {
	if (total <= 0) {
		return 0;
	}

	return Math.ceil(total / pageSize);
}

/**
 * Keeps a page index inside the collection. Needed because the collection
 * shrinks under the visitor: selecting a narrower category can leave the current
 * page past the end.
 */
export function clampPage(
	page: number,
	total: number,
	pageSize: number = GALLERY_PAGE_SIZE,
): number {
	const lastPage = Math.max(getPageCount(total, pageSize) - 1, 0);

	return Math.min(Math.max(page, 0), lastPage);
}

export function getPageItems<T>(
	items: readonly T[],
	page: number,
	pageSize: number = GALLERY_PAGE_SIZE,
): T[] {
	const start = page * pageSize;

	return items.slice(start, start + pageSize);
}

/** Page that holds a given absolute index in the filtered collection. */
export function getPageForIndex(
	index: number,
	pageSize: number = GALLERY_PAGE_SIZE,
): number {
	return Math.floor(index / pageSize);
}

/**
 * Steps an absolute index through the whole filtered collection, wrapping at
 * both ends. The lightbox walks every filtered photo, not just the current page,
 * so paging never traps the visitor in a twelve-image loop.
 */
export function wrapIndex(
	current: number,
	total: number,
	delta: 1 | -1,
): number {
	if (total <= 0) {
		return 0;
	}

	return (current + delta + total) % total;
}

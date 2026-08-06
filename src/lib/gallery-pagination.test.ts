import { describe, expect, it } from "vitest";

import {
	GALLERY_PAGE_SIZE,
	clampPage,
	getPageCount,
	getPageForIndex,
	getPageItems,
	wrapIndex,
} from "@/lib/gallery-pagination";

describe("getPageCount", () => {
	it("reports no pages for an empty collection", () => {
		expect(getPageCount(0)).toBe(0);
	});

	it("fits a partial page into a single page", () => {
		expect(getPageCount(1)).toBe(1);
		expect(getPageCount(GALLERY_PAGE_SIZE - 1)).toBe(1);
	});

	it("keeps an exactly full collection at one page", () => {
		expect(getPageCount(GALLERY_PAGE_SIZE)).toBe(1);
	});

	it("opens a new page for the first overflowing item", () => {
		expect(getPageCount(GALLERY_PAGE_SIZE + 1)).toBe(2);
	});

	it("counts the trailing partial page of a large collection", () => {
		expect(getPageCount(104, 12)).toBe(9);
	});
});

describe("clampPage", () => {
	it("keeps a page that exists", () => {
		expect(clampPage(3, 104, 12)).toBe(3);
	});

	it("pulls a page past the end back to the last page", () => {
		expect(clampPage(50, 104, 12)).toBe(8);
	});

	it("pulls a negative page back to the first", () => {
		expect(clampPage(-3, 104, 12)).toBe(0);
	});

	it("collapses to the first page when the filter emptied the collection", () => {
		expect(clampPage(4, 0, 12)).toBe(0);
	});
});

describe("getPageItems", () => {
	const items = Array.from({ length: 25 }, (_, index) => index);

	it("returns the first window for page zero", () => {
		expect(getPageItems(items, 0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	it("returns a middle window", () => {
		expect(getPageItems(items, 1, 10)).toEqual([
			10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
		]);
	});

	it("returns only what is left on the trailing partial page", () => {
		expect(getPageItems(items, 2, 10)).toEqual([20, 21, 22, 23, 24]);
	});

	it("returns nothing for a page beyond the collection", () => {
		expect(getPageItems(items, 9, 10)).toEqual([]);
	});
});

describe("getPageForIndex", () => {
	it("maps the first window to the first page", () => {
		expect(getPageForIndex(0, 12)).toBe(0);
		expect(getPageForIndex(11, 12)).toBe(0);
	});

	it("maps the first item of the second window to the second page", () => {
		expect(getPageForIndex(12, 12)).toBe(1);
	});

	it("maps a deep index to its page", () => {
		expect(getPageForIndex(103, 12)).toBe(8);
	});
});

describe("wrapIndex", () => {
	it("steps forward inside the collection", () => {
		expect(wrapIndex(11, 104, 1)).toBe(12);
	});

	it("wraps forward from the last item to the first", () => {
		expect(wrapIndex(103, 104, 1)).toBe(0);
	});

	it("steps backward inside the collection", () => {
		expect(wrapIndex(12, 104, -1)).toBe(11);
	});

	it("wraps backward from the first item to the last", () => {
		expect(wrapIndex(0, 104, -1)).toBe(103);
	});

	it("stays at the origin for an empty collection", () => {
		expect(wrapIndex(0, 0, 1)).toBe(0);
	});
});

import { describe, expect, it } from "vitest";

import type { GalleryCategory } from "./gallery-category";
import {
	buildGalleryFilterChips,
	DEFAULT_GALLERY_ALL_FILTER_LABEL,
	filterByCategoryId,
} from "./gallery-filter";

const CATEGORIES: GalleryCategory[] = [
	{ id: "category-deporte", name: "Deporte" },
	{ id: "category-integracion", name: "Integración" },
];

/**
 * Only the field the predicate is allowed to read. Written as a bare shape
 * rather than a `GalleryItem` on purpose: if a future change ever reaches for a
 * name, these fixtures do not carry one and the test cannot be made to pass.
 */
type FilterableItem = { id: string; category_id: string | null };

const ITEMS: FilterableItem[] = [
	{ id: "bound-deporte", category_id: "category-deporte" },
	{ id: "bound-integracion", category_id: "category-integracion" },
	{ id: "bound-inactive-category", category_id: "category-archivada" },
	{ id: "unbound", category_id: null },
];

describe("gallery filter chips", () => {
	it("puts the catch-all chip first, carrying no category", () => {
		const chips = buildGalleryFilterChips(CATEGORIES, "Todas");

		expect(chips).toEqual([
			{ id: null, label: "Todas" },
			{ id: "category-deporte", label: "Deporte" },
			{ id: "category-integracion", label: "Integración" },
		]);
	});

	// The read already sorted by ascending `order_index`. Re-sorting here would be
	// a second opinion about chip order that could disagree with the first.
	it("keeps the order the read handed it", () => {
		const chips = buildGalleryFilterChips(
			[...CATEGORIES].reverse(),
			"Todas",
		);

		expect(chips.map((chip) => chip.id)).toEqual([
			null,
			"category-integracion",
			"category-deporte",
		]);
	});

	it("renders the catch-all label from the setting when it holds one", () => {
		const chips = buildGalleryFilterChips(CATEGORIES, "Ver todo");

		expect(chips[0]).toEqual({ id: null, label: "Ver todo" });
	});

	// The setting is registered as not required precisely so a missing row cannot
	// 500 the public page. Both an absent row and a row that exists but is blank
	// arrive here as an empty-ish string, so the fallback covers the value.
	it.each([
		["absent", ""],
		["blank", "   "],
		["a tab", "\t"],
	])("falls back to Todas when the label is %s", (_case, allFilterLabel) => {
		const chips = buildGalleryFilterChips(CATEGORIES, allFilterLabel);

		expect(chips[0]).toEqual({
			id: null,
			label: DEFAULT_GALLERY_ALL_FILTER_LABEL,
		});
		expect(DEFAULT_GALLERY_ALL_FILTER_LABEL).toBe("Todas");
	});

	it("shows no category chip when no category is active", () => {
		expect(buildGalleryFilterChips([], "Todas")).toEqual([
			{ id: null, label: "Todas" },
		]);
	});
});

describe("gallery filtering by category id", () => {
	it("shows every photo under the catch-all, bound or not", () => {
		expect(filterByCategoryId(ITEMS, null)).toEqual(ITEMS);
	});

	it("shows only the photos bound to the selected category", () => {
		expect(filterByCategoryId(ITEMS, "category-deporte")).toEqual([
			{ id: "bound-deporte", category_id: "category-deporte" },
		]);
	});

	it("leaves an unbound photo out of every category chip", () => {
		for (const category of CATEGORIES) {
			expect(
				filterByCategoryId(ITEMS, category.id).map((item) => item.id),
			).not.toContain("unbound");
		}

		expect(filterByCategoryId(ITEMS, null).map((item) => item.id)).toContain(
			"unbound",
		);
	});

	// An inactive category produces no chip, so its photos are only ever reached
	// through the catch-all. They must not vanish from the gallery.
	it("keeps a photo whose category has no chip reachable under the catch-all", () => {
		expect(filterByCategoryId(ITEMS, null).map((item) => item.id)).toContain(
			"bound-inactive-category",
		);
	});

	// Two categories may legitimately read the same. Identity keeps them apart;
	// a name comparison would merge them and show one chip's photos under both.
	it("keeps two categories sharing a display name as distinct filters", () => {
		const namesakes: GalleryCategory[] = [
			{ id: "category-a", name: "Talleres" },
			{ id: "category-b", name: "Talleres" },
		];
		const items: FilterableItem[] = [
			{ id: "in-a", category_id: "category-a" },
			{ id: "in-b", category_id: "category-b" },
		];

		expect(buildGalleryFilterChips(namesakes, "Todas").map((c) => c.label)).toEqual(
			["Todas", "Talleres", "Talleres"],
		);
		expect(filterByCategoryId(items, "category-a")).toEqual([
			{ id: "in-a", category_id: "category-a" },
		]);
		expect(filterByCategoryId(items, "category-b")).toEqual([
			{ id: "in-b", category_id: "category-b" },
		]);
	});

	// Renaming touches the record's name and nothing else, so the same id keeps
	// matching the same photos. This is the rename defect stated as a test.
	it("keeps a renamed category's photos on its chip", () => {
		const renamed: GalleryCategory[] = [
			{ id: "category-deporte", name: "Actividades Deportivas" },
		];
		const chips = buildGalleryFilterChips(renamed, "Todas");

		expect(chips[1]).toEqual({
			id: "category-deporte",
			label: "Actividades Deportivas",
		});
		expect(filterByCategoryId(ITEMS, chips[1].id)).toEqual([
			{ id: "bound-deporte", category_id: "category-deporte" },
		]);
	});

	it("returns nothing for a category no photo is bound to", () => {
		expect(filterByCategoryId(ITEMS, "category-vacia")).toEqual([]);
	});

	it("does not hand back the caller's array", () => {
		const items = [...ITEMS];

		expect(filterByCategoryId(items, null)).not.toBe(items);
	});
});

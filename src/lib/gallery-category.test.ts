import { describe, expect, it } from "vitest";

import {
	toGalleryItem,
	type GalleryItemJoinRow,
} from "@/lib/gallery-category";

function createJoinRow(
	overrides: Partial<GalleryItemJoinRow> = {},
): GalleryItemJoinRow {
	return {
		id: "gallery-1",
		title: "Natación",
		category: "Deporte",
		category_id: null,
		image_url: "/galeria/2.jpg",
		width: 2048,
		height: 1536,
		gallery_categories: null,
		...overrides,
	};
}

describe("toGalleryItem", () => {
	it("resolves the category from an active bound record", () => {
		const item = toGalleryItem(
			createJoinRow({
				category: "deporte",
				category_id: "category-1",
				gallery_categories: { name: "Deporte", is_active: true },
			}),
		);

		expect(item.category).toBe("Deporte");
	});

	// The record is the source of truth once an item is bound, so a legacy string
	// that drifted away from it must not win.
	it("prefers the bound record over drifted legacy text", () => {
		const item = toGalleryItem(
			createJoinRow({
				category: "Deportes al aire libre",
				category_id: "category-1",
				gallery_categories: { name: "Deporte", is_active: true },
			}),
		);

		expect(item.category).toBe("Deporte");
	});

	// Anon RLS hides inactive categories, so the embed normally arrives absent
	// rather than inactive. The explicit check is the mandated app-side filter:
	// the server role sees every row and must reach the same answer.
	it("falls back to the legacy text when the bound record is inactive", () => {
		const item = toGalleryItem(
			createJoinRow({
				category: "Deporte",
				category_id: "category-1",
				gallery_categories: { name: "Archivado", is_active: false },
			}),
		);

		expect(item.category).toBe("Deporte");
	});

	// A category the reader cannot see comes back as an absent embedded object,
	// not an error. The item stays visible under its old text.
	it("falls back to the legacy text when no record is embedded", () => {
		const item = toGalleryItem(
			createJoinRow({
				category: "Integración",
				category_id: "category-2",
				gallery_categories: null,
			}),
		);

		expect(item.category).toBe("Integración");
	});

	it("keeps an unbound item readable through its legacy text", () => {
		const item = toGalleryItem(
			createJoinRow({
				category: "Categoria",
				category_id: null,
				gallery_categories: null,
			}),
		);

		expect(item.category).toBe("Categoria");
		expect(item.category_id).toBeNull();
	});

	it("trims surrounding whitespace off both sources", () => {
		expect(
			toGalleryItem(
				createJoinRow({
					gallery_categories: { name: "  Deporte  ", is_active: true },
				}),
			).category,
		).toBe("Deporte");

		expect(
			toGalleryItem(createJoinRow({ category: "  Integración  " })).category,
		).toBe("Integración");
	});

	// GallerySection lowercases this value to match it against a chip, so it can
	// never be null. An empty string matches no chip, which leaves the item under
	// the catch-all — the same place an uncategorized photo belongs.
	it("resolves to an empty string when neither source has a name", () => {
		expect(
			toGalleryItem(createJoinRow({ category: null })).category,
		).toBe("");
		expect(
			toGalleryItem(createJoinRow({ category: "   " })).category,
		).toBe("");
	});

	it("carries the binding and the stored dimensions through unchanged", () => {
		const item = toGalleryItem(
			createJoinRow({
				id: "gallery-7",
				title: "Creatividad",
				category_id: "category-4",
				image_url: "/galeria/7.jpg",
				width: 1024,
				height: 768,
			}),
		);

		expect(item).toEqual({
			id: "gallery-7",
			title: "Creatividad",
			category: "Deporte",
			category_id: "category-4",
			image_url: "/galeria/7.jpg",
			width: 1024,
			height: 768,
		});
	});

	// Rows created before the browser captured dimensions keep them empty and the
	// grid falls back to a nominal box.
	it("keeps missing dimensions null", () => {
		const item = toGalleryItem(createJoinRow({ width: null, height: null }));

		expect(item.width).toBeNull();
		expect(item.height).toBeNull();
	});
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(filePath: string) {
	return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("GallerySection styling parity", () => {
	it("keeps GallerySection styling aligned to legacy hover/filter requirements", () => {
		const componentSource = readProjectFile(
			"src/components/sections/GallerySection.tsx",
		);

		expect(componentSource).not.toContain("ZoomIn");
		expect(componentSource).toContain('from "motion/react"');
		expect(componentSource).toContain("AnimatePresence");
		expect(componentSource).toContain("motion.div");
		expect(componentSource).toContain("rounded-lg");
		expect(componentSource).toContain("bg-[#ff7e2e] text-white");
		expect(componentSource).toContain("hover:bg-[#ff7e2e] hover:text-white");
		expect(componentSource).toContain("gap-0");
		expect(componentSource).toContain("bg-white/70");
		expect(componentSource).toContain("font-heading text-[18px]");
		expect(componentSource).toContain("font-bold text-[#222222]");
		expect(componentSource).toContain("[margin:25px_0_20px]");
		expect(componentSource).toContain("font-sans text-[14px]");
		expect(componentSource).toContain("text-[#000000]");
		expect(componentSource).toContain("normal-case");
		expect(componentSource).toContain("object-contain");
		expect(componentSource).toContain("h-auto");
		expect(componentSource).not.toContain("aspect-square");
		expect(componentSource).not.toContain("object-cover");
		expect(componentSource).not.toContain("rounded shadow-sm");
		expect(componentSource).not.toContain("bg-primary/95");
	});

	// Replaces the former `GALLERY_VISIBLE_INCREMENT` / `Ver más` assertions. The
	// section pages instead of accumulating, so its height no longer grows with
	// the number of loaded photos, and nothing here may reintroduce that.
	it("pages the grid instead of accumulating visible items", () => {
		const componentSource = readProjectFile(
			"src/components/sections/GallerySection.tsx",
		);

		expect(componentSource).toContain('from "@/lib/gallery-pagination"');
		expect(componentSource).toContain("getPageItems");
		expect(componentSource).toContain("Página {currentPage + 1} de {pageCount}");
		expect(componentSource).not.toContain("Ver más");
		expect(componentSource).not.toContain("visibleCount");
		expect(componentSource).not.toContain("hasMoreItems");
	});

	// Replaces the former `galleryFilterLabels` assertions. Chips come from the
	// category records and match on `category_id`; the ABSENCE half is the point,
	// exactly as with `Ver más` and `visibleCount` above. Name comparison was the
	// drift mechanism: `resolveCategory` returns the bound record's name, so a
	// rename moved every bound photo's resolved name while the stored filter label
	// still held the old text, and the chip it renamed silently emptied. Nothing
	// may put that comparison back without failing here.
	it("matches photos to filter chips by category id, never by category name", () => {
		const componentSource = readProjectFile(
			"src/components/sections/GallerySection.tsx",
		);

		expect(componentSource).toContain('from "@/lib/gallery-filter"');
		expect(componentSource).toContain("buildGalleryFilterChips(");
		expect(componentSource).toContain(
			"filterByCategoryId(gallery, activeCategoryId)",
		);
		expect(componentSource).toContain("useState<string | null>(null)");
		expect(componentSource).toContain('key={chip.id ?? "all"}');
		expect(componentSource).toContain("chip.id === activeCategoryId");

		// No name comparison, and no label-shaped filter state to compare against.
		expect(componentSource).not.toContain("toLowerCase()");
		expect(componentSource).not.toContain("galleryFilterLabels");
		expect(componentSource).not.toContain("activeFilter");
		expect(componentSource).not.toContain("isAllFilter");
	});

	// The hardcoded 640x480 hint was applied to every photo regardless of its real
	// shape, which is what made the section jump as images decoded.
	it("reserves each preview's box from its stored dimensions", () => {
		const componentSource = readProjectFile(
			"src/components/sections/GallerySection.tsx",
		);

		expect(componentSource).toContain("width={item.width ?? FALLBACK_IMAGE_WIDTH}");
		expect(componentSource).toContain(
			"height={item.height ?? FALLBACK_IMAGE_HEIGHT}",
		);
		expect(componentSource).not.toContain("width={640}");
		expect(componentSource).not.toContain("height={480}");
	});

	// Paging must not shrink the lightbox: it walks the filtered collection so a
	// visitor can still reach every photo without clicking through pages.
	it("navigates the lightbox across the whole filtered collection", () => {
		const componentSource = readProjectFile(
			"src/components/sections/GallerySection.tsx",
		);

		expect(componentSource).toContain(
			"nextLightboxPosition(selectedItemIndex, filteredCount",
		);
		expect(componentSource).toContain("setPage(next.page)");
		expect(componentSource).toContain(
			"{selectedItemIndex + 1} de {filteredCount}",
		);
	});
});

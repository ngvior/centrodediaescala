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
		expect(componentSource).toContain("GALLERY_VISIBLE_INCREMENT = 20");
		expect(componentSource).toContain("visibleItems");
		expect(componentSource).toContain("hasMoreItems");
		expect(componentSource).toContain("Ver más");
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
		expect(componentSource).toContain("width={640}");
		expect(componentSource).toContain("height={480}");
		expect(componentSource).not.toContain("aspect-square");
		expect(componentSource).not.toContain("object-cover");
		expect(componentSource).not.toContain("rounded shadow-sm");
		expect(componentSource).not.toContain("bg-primary/95");
	});
});

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { QUOTE_BAND_BACKGROUND_IMAGE, QUOTE_BAND_TEXT } from "./QuoteBand";

const PUBLIC_UI_SOURCE_FILES = [
	"src/app/globals.css",
	"src/components/sections/GallerySection.tsx",
	"src/components/interview-request-form.tsx",
	"src/components/layout/footer.tsx",
];

describe("QuoteBand legacy design-system parity", () => {
	it("exports the approved quote text and background image contract", () => {
		expect(QUOTE_BAND_TEXT).toBe(
			"Nosotros mismos debemos ser el cambio que deseamos ver en el mundo",
		);
		expect(QUOTE_BAND_BACKGROUND_IMAGE).toBe("/poligan_bg.jpg");
	});

	it("keeps the legacy background layout without a dark overlay", () => {
		const source = readFileSync(
			path.join(process.cwd(), "src/components/sections/QuoteBand.tsx"),
			"utf8",
		);

		expect(source).not.toContain("bg-black/55");
		expect(source).toContain('backgroundPosition: "left top"');
		expect(source).toContain('backgroundRepeat: "no-repeat"');
	});

	it("uses the approved legacy quote typography", () => {
		const source = readFileSync(
			path.join(process.cwd(), "src/components/sections/QuoteBand.tsx"),
			"utf8",
		);

		expect(source).toContain("font-sans");
		expect(source).toContain("text-[25px]");
		expect(source).toContain("font-normal");
		expect(source).toContain("normal-case");
	});

	it("does not hardcode low-contrast #888888 text outside the approved activities treatment", () => {
		for (const file of PUBLIC_UI_SOURCE_FILES) {
			const source = readFileSync(path.join(process.cwd(), file), "utf8");

			expect(source, file).not.toContain("text-[#888888]");
			expect(source, file).not.toContain("#888888");
		}
	});

	it("allows the approved activities description soft-gray treatment", () => {
		const pageSource = readFileSync(
			path.join(process.cwd(), "src/app/(public)/page.tsx"),
			"utf8",
		);

		expect(pageSource).toContain(
			"text-sm leading-[24px] text-[#888888] whitespace-pre-line",
		);
	});

	it("inserts QuoteBand after the gallery and before the team section", () => {
		const pageSource = readFileSync(
			path.join(process.cwd(), "src/app/(public)/page.tsx"),
			"utf8",
		);

		expect(pageSource).toContain("import { QuoteBand }");
		expect(pageSource.indexOf("<GallerySection")).toBeGreaterThan(-1);
		expect(pageSource.indexOf("<QuoteBand />")).toBeGreaterThan(
			pageSource.indexOf("<GallerySection"),
		);
		expect(pageSource.indexOf("<QuoteBand />")).toBeLessThan(
			pageSource.indexOf('id="team"'),
		);
	});
});

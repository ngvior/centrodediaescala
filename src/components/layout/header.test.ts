import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile header sheet behavior", () => {
	it("controls the mobile Sheet open state and closes it after link activation", () => {
		const source = readFileSync(
			path.join(process.cwd(), "src/components/layout/header.tsx"),
			"utf8",
		);

		expect(source).toContain("useState");
		expect(source).toContain("mobileMenuOpen");
		expect(source).toContain("setMobileMenuOpen");
		expect(source).toContain("open={mobileMenuOpen}");
		expect(source).toContain("onOpenChange=");
		expect(source).toContain("scrollTo(e, item.href);");
		expect(source).toContain("setMobileMenuOpen(false);");
		expect(source.indexOf("scrollTo(e, item.href);")).toBeLessThan(
			source.indexOf("setMobileMenuOpen(false);"),
		);
	});
});

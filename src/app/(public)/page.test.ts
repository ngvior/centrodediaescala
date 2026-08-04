import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readPublicPageSource() {
	return readFileSync(
		path.join(process.cwd(), "src/app/(public)/page.tsx"),
		"utf8",
	);
}

describe("public contact section legacy parity", () => {
	it("renders four editable contact items with legacy label colors", () => {
		const source = readPublicPageSource();

		expect(source).toContain("siteSettings.contact_address_label");
		expect(source).toContain("siteSettings.contact_phone_label");
		expect(source).toContain("siteSettings.contact_schedule_label");
		expect(source).toContain("siteSettings.contact_email_label");
		expect(source).toContain("siteSettings.contact_email");
		expect(source).toContain('iconClassName: "text-[#ff205e]"');
		expect(source).toContain('iconClassName: "text-[#ff7e2e]"');
		expect(source).toContain('iconClassName: "text-[#94d500]"');
		expect(source).toContain('iconClassName: "text-[#49b5e7]"');
		expect(source).toContain("lg:grid-cols-4");
		expect(source).not.toContain("md:grid-cols-3 gap-8");
		expect(source).not.toContain("hover:border-primary");
	});

	it("embeds the legacy Google Maps URL safely and responsively", () => {
		const source = readPublicPageSource();

		expect(source).toContain("CONTACT_MAP_EMBED_URL");
		expect(source).toContain("https://www.google.com/maps/embed?pb=!1m18");
		expect(source).toContain("<iframe");
		expect(source).toContain(
			'title="Mapa de ubicación de Escala Centro de Día"',
		);
		expect(source).toContain('loading="lazy"');
		expect(source).toContain('referrerPolicy="no-referrer-when-downgrade"');
		expect(source).toContain("allowFullScreen");
		expect(source).toContain("aspect-[4/3]");
		expect(source).not.toContain("dangerouslySetInnerHTML");
	});

	it("does not render a standalone social block between contact cards and the map", () => {
		const source = readPublicPageSource();

		expect(source).not.toContain("CONTACT_SOCIAL_BUTTON_CLASSES");
		expect(source).not.toContain("getPublicSocialLinks");
		expect(source).not.toContain("siteSettings.social_facebook");
		expect(source).not.toContain("siteSettings.social_instagram");
		expect(source).not.toContain(
			'link.platform === "facebook" || link.platform === "instagram"',
		);
	});
});

describe("public activities staggered layout", () => {
	it("distributes activities across two independent columns with the second one offset", () => {
		const source = readPublicPageSource();

		// The complete class string is asserted because individual utilities are
		// not discriminating: "items-start" already appears in the compliance list.
		expect(source).toContain(
			'className="mx-auto mt-12 grid max-w-[920px] grid-cols-1 items-start gap-x-12 gap-y-12 md:grid-cols-2"',
		);
		expect(source).toContain(
			"activities.filter((_, index) => index % 2 === 0)",
		);
		expect(source).toContain(
			"activities.filter((_, index) => index % 2 === 1)",
		);
		expect(source).toContain("activityColumns.map((column, columnIndex) => (");
		expect(source).toContain(
			'columnIndex === 1 && column.length > 0 && "md:mt-14"',
		);
		expect(source).toContain('id="work_outer"');

		// The wrapping flexbox and its per-item width wrapper are gone. The
		// prefix includes "mt-12" because the professionals section legitimately
		// keeps "flex max-w-[920px] flex-wrap".
		expect(source).not.toContain("mt-12 flex max-w-[920px] flex-wrap");
		expect(source).not.toContain("md:w-[calc(50%-24px)]");
	});

	it("keeps the ActivitySummary card format untouched", () => {
		const source = readPublicPageSource();

		expect(source).toContain('<div className="flex gap-6">');
		expect(source).toContain(
			'className="w-[60px] h-[60px] bg-white rounded-full shrink-0 flex items-center justify-center shadow-sm mt-1 border border-[#e5e5e5]"',
		);
		expect(source).toContain('<h3 className="text-xl mb-3">{activity.title}</h3>');
		expect(source).toContain(
			'className="text-sm leading-[24px] text-[#888888] whitespace-pre-line"',
		);
	});
});

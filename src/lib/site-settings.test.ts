import { describe, expect, it } from "vitest";

import {
	buildAdminSiteSettings,
	NAVIGATION_SECTIONS,
	normalizeSiteSettingValue,
	parsePublicSiteSettings,
	parseSiteSettingValue,
	PUBLIC_ANCHORS,
	SITE_SETTING_DEFINITIONS,
	type SiteSettingRow,
	type SiteSettingType,
} from "./site-settings";

function createRows(): SiteSettingRow[] {
	return SITE_SETTING_DEFINITIONS.map((definition) => ({
		setting_key: definition.key,
		setting_value: getDefaultSettingValue(definition.key, definition.type),
		setting_type: definition.type,
	}));
}

function getDefaultSettingValue(
	settingKey: string,
	settingType: SiteSettingType,
) {
	if (settingKey === "header_navigation") {
		return JSON.stringify([{ label: "Inicio", href: "#inicio" }]);
	}

	if (settingType === "JSON") {
		return JSON.stringify([`db-${settingKey}`]);
	}

	return `db-${settingKey}`;
}

describe("site settings optional social links", () => {
	it("allows social settings to be missing without throwing", () => {
		const rows = createRows().filter(
			(row) =>
				![
					"social_facebook",
					"social_instagram",
					"social_linkedin",
					"social_twitter",
				].includes(row.setting_key),
		);

		expect(parsePublicSiteSettings(rows)).toMatchObject({
			social_facebook: "",
			social_instagram: "",
			social_linkedin: "",
			social_twitter: "",
		});
	});

	it("allows optional social settings to be empty without throwing", () => {
		const rows = createRows().map((row) =>
			[
				"social_facebook",
				"social_instagram",
				"social_linkedin",
				"social_twitter",
			].includes(row.setting_key)
				? { ...row, setting_value: "   " }
				: row,
		);

		expect(parsePublicSiteSettings(rows)).toMatchObject({
			social_facebook: "",
			social_instagram: "",
			social_linkedin: "",
			social_twitter: "",
		});
		expect(normalizeSiteSettingValue("social_facebook", "   ", "LINK")).toBe(
			"",
		);
		expect(normalizeSiteSettingValue("social_instagram", "   ", "LINK")).toBe(
			"",
		);
		expect(buildAdminSiteSettings(rows)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ key: "social_facebook", displayValue: "" }),
				expect.objectContaining({ key: "social_instagram", displayValue: "" }),
				expect.objectContaining({ key: "social_linkedin", displayValue: "" }),
				expect.objectContaining({ key: "social_twitter", displayValue: "" }),
			]),
		);
	});

	it("defines editable contact email settings and optional Instagram settings", () => {
		expect(SITE_SETTING_DEFINITIONS).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					key: "contact_email",
					group: "CONTACTO",
					type: "TEXT",
				}),
				expect.objectContaining({
					key: "contact_email_label",
					group: "CONTACTO",
					type: "TEXT",
				}),
				expect.objectContaining({
					key: "social_instagram",
					group: "REDES",
					type: "LINK",
					required: false,
				}),
			]),
		);
	});

	it("only offers navigation sections whose anchors actually exist (no dead links)", () => {
		// Correction #2: every friendly option must resolve to a real page anchor.
		// PUBLIC_ANCHORS still contains never-rendered legacy names (#inicio, …),
		// but those must NOT be offered as choices — only preserved per-row.
		const realPageAnchors = new Set([
			"#top_content",
			"#service",
			"#work_outer",
			"#galeria",
			"#team",
			"#contact",
			"camina.html",
		]);

		for (const section of NAVIGATION_SECTIONS) {
			expect(PUBLIC_ANCHORS.has(section.href)).toBe(true);
			expect(realPageAnchors.has(section.href)).toBe(true);
		}

		const deadAnchors = ["#inicio", "#institucion", "#actividades", "#equipo", "#contacto"];
		const offered = new Set(NAVIGATION_SECTIONS.map((section) => section.href));
		for (const dead of deadAnchors) {
			expect(offered.has(dead)).toBe(false);
		}
	});

	it("accepts the JSON shapes produced by the friendly editors", () => {
		// StringListEditor serializes a trimmed non-empty string[].
		expect(
			parseSiteSettingValue(
				"about_compliance_items",
				JSON.stringify(["Habilitación municipal", "Seguro vigente"]),
				"JSON",
			),
		).toEqual(["Habilitación municipal", "Seguro vigente"]);

		// NavigationEditor serializes a { label, href }[] using real anchors.
		expect(
			parseSiteSettingValue(
				"header_navigation",
				JSON.stringify([
					{ label: "Inicio", href: NAVIGATION_SECTIONS[0].href },
					{ label: "Contacto", href: "#contact" },
				]),
				"JSON",
			),
		).toEqual([
			{ label: "Inicio", href: "#top_content" },
			{ label: "Contacto", href: "#contact" },
		]);

		// A preserved legacy anchor still validates (round-trips on save).
		expect(
			parseSiteSettingValue(
				"header_navigation",
				JSON.stringify([{ label: "Institución", href: "#institucion" }]),
				"JSON",
			),
		).toEqual([{ label: "Institución", href: "#institucion" }]);
	});

	it("still fails when required non-social settings are missing or empty", () => {
		const rowsMissingRequired = createRows().filter(
			(row) => row.setting_key !== "about_text",
		);
		expect(() => parsePublicSiteSettings(rowsMissingRequired)).toThrow(
			"Missing required site settings: about_text",
		);

		const rowsEmptyRequired = createRows().map((row) =>
			row.setting_key === "about_text" ? { ...row, setting_value: "   " } : row,
		);
		expect(() => parsePublicSiteSettings(rowsEmptyRequired)).toThrow(
			"Empty required site setting: about_text",
		);
	});
});

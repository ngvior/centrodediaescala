import { describe, expect, it } from "vitest";

import { buildGalleryFilterChips } from "./gallery-filter";
import {
	buildAdminSiteSettings,
	getSiteSettingDefinition,
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

describe("gallery catch-all filter label setting", () => {
	it("is registered as a not-required GALERIA text setting", () => {
		expect(SITE_SETTING_DEFINITIONS).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					key: "gallery_all_filter_label",
					group: "GALERIA",
					type: "TEXT",
					input: "input",
					label: "Etiqueta filtro todas",
					description:
						"Texto del filtro que muestra todas las fotos de la galería.",
					required: false,
				}),
			]),
		);
	});

	// The whole reason it is not required. A required row missing in production
	// aborts the entire parse, which would 500 the public homepage over a label.
	it("parses the public settings without its row instead of throwing", () => {
		const rows = createRows().filter(
			(row) => row.setting_key !== "gallery_all_filter_label",
		);

		expect(() => parsePublicSiteSettings(rows)).not.toThrow();
		expect(parsePublicSiteSettings(rows)).toMatchObject({
			gallery_all_filter_label: "",
		});
	});

	// A not-required row that EXISTS but is blank resolves to "" too, which is why
	// the gallery's fallback covers the value and not only the row's absence.
	it("resolves a blank row to an empty value", () => {
		const rows = createRows().map((row) =>
			row.setting_key === "gallery_all_filter_label"
				? { ...row, setting_value: "   " }
				: row,
		);

		expect(parsePublicSiteSettings(rows)).toMatchObject({
			gallery_all_filter_label: "",
		});
		expect(
			normalizeSiteSettingValue("gallery_all_filter_label", "   ", "TEXT"),
		).toBe("");
	});

	// Both the absent and the blank case land on the same rendered label, and the
	// fallback that produces it lives in the pure chip builder, not in the parse.
	it.each([
		["an absent row", undefined],
		["a blank row", "   "],
	])("renders the catch-all chip as Todas for %s", (_case, settingValue) => {
		const rows =
			settingValue === undefined
				? createRows().filter(
						(row) => row.setting_key !== "gallery_all_filter_label",
					)
				: createRows().map((row) =>
						row.setting_key === "gallery_all_filter_label"
							? { ...row, setting_value: settingValue }
							: row,
					);
		const settings = parsePublicSiteSettings(rows);

		expect(
			buildGalleryFilterChips([], settings.gallery_all_filter_label)[0],
		).toEqual({ id: null, label: "Todas" });
	});
});

describe("retired gallery filter labels setting", () => {
	it("has no definition, so Configuración offers no editor for it", () => {
		expect(
			SITE_SETTING_DEFINITIONS.map((definition) => definition.key),
		).not.toContain("gallery_filter_labels");
		expect(getSiteSettingDefinition("gallery_filter_labels")).toBeUndefined();
	});

	// A Configuración tab loaded before the definition was removed can still POST
	// the old key. Refusing it loudly is what keeps the stored row intact: the
	// alternative is `updateSiteSetting` writing a value nothing reads.
	it("refuses a stale submission with the Spanish unknown-setting message", () => {
		expect(() =>
			normalizeSiteSettingValue(
				"gallery_filter_labels",
				JSON.stringify(["Todas", "Deporte"]),
				"JSON",
			),
		).toThrow("Configuración desconocida: gallery_filter_labels");
	});
});

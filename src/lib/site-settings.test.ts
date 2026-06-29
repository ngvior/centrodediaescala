import { describe, expect, it } from "vitest";

import {
	buildAdminSiteSettings,
	normalizeSiteSettingValue,
	parsePublicSiteSettings,
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

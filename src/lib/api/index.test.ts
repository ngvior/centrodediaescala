import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
	createRequiredSiteSettingsRows,
	createSupabaseClientMock,
} from "@/test/supabase-test-helpers";
import { REQUIRED_SITE_SETTING_KEYS } from "@/lib/site-settings";

const SOURCE_ROOT = "src";

// Matched against import syntax rather than the bare module name so this file's
// own pattern literal is not reported as an offender.
const MOCK_CONTENT_MODULE_IMPORT =
	/\b(?:from|import|require)\s*\(?\s*["'][^"']*(?:cms-mock|mock-cms|content-mock|mock-content)(?:\.[jt]sx?)?["']/;

function listSourceFiles() {
	return readdirSync(path.join(process.cwd(), SOURCE_ROOT), {
		recursive: true,
		encoding: "utf8",
	}).filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"));
}

const apiMocks = vi.hoisted(() => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: apiMocks.createClient,
}));

import { getActivities, getProfessionals, getSiteSettings } from "./index";

describe("public data API", () => {
	beforeEach(() => {
		apiMocks.createClient.mockReset();
	});

	it("reads site settings from Supabase and normalizes rows by setting key", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "site_settings",
				response: { data: createRequiredSiteSettingsRows(), error: null },
			},
		]);
		apiMocks.createClient.mockResolvedValue(client);

		await expect(getSiteSettings()).resolves.toMatchObject({
			contact_phone: "db-contact_phone",
			home_hero_title: "db-home_hero_title",
			about_compliance_items: ["db-about_compliance_items"],
			header_navigation: [{ label: "Inicio", href: "#inicio" }],
		});

		expect(client.from).toHaveBeenCalledWith("site_settings");
		expect(queries[0].select).toHaveBeenCalledWith(
			"setting_key, setting_value, setting_type",
		);
	});

	it("fails safely when a required site setting is missing", async () => {
		const rows = createRequiredSiteSettingsRows().filter(
			(row) => row.setting_key !== "about_text",
		);
		const { client } = createSupabaseClientMock([
			{
				table: "site_settings",
				response: { data: rows, error: null },
			},
		]);
		apiMocks.createClient.mockResolvedValue(client);

		await expect(getSiteSettings()).rejects.toThrow(
			"Missing required site settings: about_text",
		);
	});

	it("fails safely when a required JSON site setting is malformed", async () => {
		const rows = createRequiredSiteSettingsRows().map((row) =>
			row.setting_key === "about_compliance_items"
				? { ...row, setting_value: "{broken-json" }
				: row,
		);
		const { client } = createSupabaseClientMock([
			{
				table: "site_settings",
				response: { data: rows, error: null },
			},
		]);
		apiMocks.createClient.mockResolvedValue(client);

		await expect(getSiteSettings()).rejects.toThrow(
			"Malformed JSON site setting: about_compliance_items",
		);
	});

	it("keeps seed defaults aligned with every required setting key", () => {
		const seedSql = readFileSync(
			path.join(process.cwd(), "supabase/seed.sql"),
			"utf8",
		);

		for (const key of REQUIRED_SITE_SETTING_KEYS) {
			expect(seedSql).toContain(`'${key}'`);
		}
	});

	it("keeps optional social seed rows aligned with the public social contract", () => {
		const seedSql = readFileSync(
			path.join(process.cwd(), "supabase/seed.sql"),
			"utf8",
		);

		expect(seedSql).toContain("'social_facebook'");
		expect(seedSql).toContain("'social_instagram'");
		expect(seedSql).toContain("'social_linkedin'");
		expect(seedSql).toContain("'social_twitter'");
		expect(seedSql).toContain("'contact_email', 'escalaelcentrodedia@gmail.com'");
		expect(seedSql).toContain("'contact_email_label', 'Email'");
		expect(seedSql).toContain(
			"'social_facebook', 'https://www.facebook.com/centrodediaescala'",
		);
		expect(seedSql).toContain(
			"'social_instagram', 'https://www.instagram.com/centrodediaescala/'",
		);
	});

	it("fails explicitly when Supabase returns a read error", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "professionals",
				response: {
					data: null,
					error: { message: "database unavailable" },
				},
			},
		]);
		apiMocks.createClient.mockResolvedValue(client);

		await expect(getProfessionals()).rejects.toThrow(
			"Supabase read failed for professionals: database unavailable",
		);
	});

	it("fails explicitly when Supabase env validation fails", async () => {
		apiMocks.createClient.mockRejectedValue(
			new Error(
				"Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
			),
		);

		await expect(getActivities()).rejects.toThrow(
			"Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
		);
	});

	it("keeps the source tree free of mock content module imports", () => {
		const offenders = listSourceFiles().filter((relativePath) =>
			MOCK_CONTENT_MODULE_IMPORT.test(
				readFileSync(
					path.join(process.cwd(), SOURCE_ROOT, relativePath),
					"utf8",
				),
			),
		);

		expect(offenders).toEqual([]);
	});

	it("reads activities from Supabase instead of a bundled content fallback", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "activities",
				response: {
					data: [
						{
							id: "activity-from-db",
							title: "Actividad desde DB",
							description: "Runtime Supabase data",
							category: "Centro de día",
							icon: "thumbs-up",
							image_url: null,
							schedule_info: null,
						},
					],
					error: null,
				},
			},
		]);
		apiMocks.createClient.mockResolvedValue(client);

		await expect(getActivities()).resolves.toEqual([
			expect.objectContaining({ id: "activity-from-db" }),
		]);
		expect(queries[0].select).toHaveBeenCalledWith(
			"id, title, description, category, icon, image_url, schedule_info",
		);
	});
});

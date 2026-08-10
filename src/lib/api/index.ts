import { cache } from "react";

import {
	toGalleryItem,
	type GalleryCategory,
	type GalleryItem,
	type GalleryItemJoinRow,
} from "@/lib/gallery-category";
import { createClient } from "@/lib/supabase/server";
import {
	parsePublicSiteSettings,
	type PublicSiteSettings,
	type SiteSettingRow,
} from "@/lib/site-settings";

export type SiteSettings = PublicSiteSettings;

export type HomeObjective = {
	id: string;
	title: string;
	description: string;
	icon: string | null;
};

export type Professional = {
	id: string;
	first_name: string;
	last_name: string;
	role: string;
	bio: string | null;
	image_url: string | null;
};

export type Activity = {
	id: string;
	title: string;
	description: string;
	category: string;
	icon: string;
	image_url: string | null;
	schedule_info: string | null;
};

export type Event = {
	id: string;
	title: string;
	slug: string;
	content: string;
	event_date: string | null;
	cover_image_url: string | null;
};

/**
 * Owned by `@/lib/gallery-category`, which resolves the shapes, and re-exported
 * here so every consumer keeps importing its page data from one module.
 *
 * Imported above and re-exported here rather than through a bare
 * `export type { … } from "…"`: that form does not bind the name locally, so the
 * reads below could not annotate themselves with it (TS2304).
 */
export type { GalleryCategory, GalleryItem };

type SupabaseResponse<T> = {
	data: T | null;
	error: { message: string } | null;
};

function assertSupabaseData<T>(
	tableName: string,
	response: SupabaseResponse<T>,
): T {
	if (response.error) {
		throw new Error(
			`Supabase read failed for ${tableName}: ${response.error.message}`,
		);
	}

	if (!response.data) {
		throw new Error(`Supabase read returned no data for ${tableName}`);
	}

	return response.data;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
	const supabase = await createClient({ anon: true });
	const response = await supabase
		.from("site_settings")
		.select("setting_key, setting_value, setting_type");

	const rows = assertSupabaseData(
		"site_settings",
		response as SupabaseResponse<SiteSettingRow[]>,
	);

	return parsePublicSiteSettings(rows);
});

export async function getHomeObjectives(): Promise<HomeObjective[]> {
	const supabase = await createClient({ anon: true });
	const response = await supabase
		.from("home_objectives")
		.select("id, title, description, icon")
		.eq("is_active", true)
		.order("order_index", { ascending: true });

	return assertSupabaseData(
		"home_objectives",
		response as SupabaseResponse<HomeObjective[]>,
	);
}

export async function getProfessionals(): Promise<Professional[]> {
	const supabase = await createClient({ anon: true });
	const response = await supabase
		.from("professionals")
		.select("id, first_name, last_name, role, bio, image_url")
		.eq("is_active", true)
		.order("order_index", { ascending: true });

	return assertSupabaseData(
		"professionals",
		response as SupabaseResponse<Professional[]>,
	);
}

export async function getActivities(): Promise<Activity[]> {
	const supabase = await createClient({ anon: true });
	const response = await supabase
		.from("activities")
		.select("id, title, description, category, icon, image_url, schedule_info")
		.eq("is_active", true)
		.order("order_index", { ascending: true });

	return assertSupabaseData(
		"activities",
		response as SupabaseResponse<Activity[]>,
	);
}

export async function getEvents(): Promise<Event[]> {
	const supabase = await createClient({ anon: true });
	const response = await supabase
		.from("events")
		.select("id, title, slug, content, event_date, cover_image_url")
		.eq("is_published", true)
		.order("created_at", { ascending: false });

	return assertSupabaseData("events", response as SupabaseResponse<Event[]>);
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
	const supabase = await createClient({ anon: true });
	// Newest first. The public section pages rather than accumulating, so page one
	// is what most visitors ever see, and `order_index` grows with each upload —
	// ascending would bury everything the client adds behind the oldest photos.
	// The title tiebreaker matches getAdminGalleryItems: `order_index` is not
	// unique, and without it two rows sharing one could come back in a different
	// order per request, so the public gallery and the admin listing would
	// disagree about what sits on the first page.
	//
	// The category is LEFT-joined, never `!inner`: an item that is not bound to a
	// category, or whose category is inactive and therefore invisible under anon
	// RLS, must still reach the visitor. An inner join would silently drop it.
	// `toGalleryItem` falls those rows back to their legacy text.
	const response = await supabase
		.from("gallery_items")
		.select(
			"id, title, category, category_id, image_url, width, height, gallery_categories(name, is_active)",
		)
		.eq("is_active", true)
		.order("order_index", { ascending: false })
		.order("title", { ascending: true });

	const rows = assertSupabaseData(
		"gallery_items",
		response as SupabaseResponse<GalleryItemJoinRow[]>,
	);

	return rows.map(toGalleryItem);
}

/**
 * The categories the public gallery offers as filter chips.
 *
 * `cache()`-wrapped like {@link getSiteSettings}: the chips and the grid are
 * rendered from one page, and per-request memoization means a second caller
 * costs nothing rather than issuing a second query.
 */
export const getGalleryCategories = cache(
	async (): Promise<GalleryCategory[]> => {
		const supabase = await createClient({ anon: true });
		// `is_active` is filtered explicitly rather than left to the anon RLS
		// policy. The policy already hides inactive categories from anon, but the
		// server role sees every row, and an archived category must not come back
		// as a public filter chip just because the caller is privileged.
		//
		// Ascending `order_index` IS the chip order the visitor sees. The category
		// backfill seeded it from the previous filter-label order, so this
		// reproduces the order the gallery already had.
		const response = await supabase
			.from("gallery_categories")
			.select("id, name")
			.eq("is_active", true)
			.order("order_index", { ascending: true });

		return assertSupabaseData(
			"gallery_categories",
			response as SupabaseResponse<GalleryCategory[]>,
		);
	},
);

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const filterLabels = [
	"Todas",
	"Deporte",
	"Integración",
	"Terapias Ocupacionales",
	"Manos que Hacen",
	"Terapia Canina",
];

const galleryItems = [
	{
		title: "Actividades Deportivas",
		category: "Deporte",
		image_url: "/galeria/1.jpg",
		order_index: 1,
		is_active: true,
	},
	{
		title: "Natación",
		category: "Deporte",
		image_url: "/galeria/2.jpg",
		order_index: 2,
		is_active: true,
	},
	{
		title: "Actividades con la Comunidad",
		category: "Integración",
		image_url: "/galeria/3.jpg",
		order_index: 3,
		is_active: true,
	},
	{
		title: "Salidas Recreativas",
		category: "Integración",
		image_url: "/galeria/4.jpg",
		order_index: 4,
		is_active: true,
	},
	{
		title: "Taller de Artesanías",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/5.jpg",
		order_index: 5,
		is_active: true,
	},
	{
		title: "Taller de Creaciones en Papel",
		category: "Manos que Hacen",
		image_url: "/galeria/6.jpg",
		order_index: 6,
		is_active: true,
	},
	{
		title: "Creatividad",
		category: "Manos que Hacen",
		image_url: "/galeria/7.jpg",
		order_index: 7,
		is_active: true,
	},
	{
		title: "Tecnología",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/8.jpg",
		order_index: 8,
		is_active: true,
	},
	{
		title: "Taller de Creación de Máscaras de Teatro",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/9.jpg",
		order_index: 9,
		is_active: true,
	},
	{
		title: "Cocina",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/10.jpg",
		order_index: 10,
		is_active: true,
	},
	{
		title: "Música",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/11.jpg",
		order_index: 11,
		is_active: true,
	},
	{
		title: "Expresión Corporal y Teatro",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/12.jpg",
		order_index: 12,
		is_active: true,
	},
	{
		title: "Participación en Ferias",
		category: "Integración",
		image_url: "/galeria/13.jpg",
		order_index: 13,
		is_active: true,
	},
	{
		title: "Serigrafía",
		category: "Terapias Ocupacionales",
		image_url: "/galeria/14.jpg",
		order_index: 14,
		is_active: true,
	},
	{
		title: "Taller de Pintura Sobre Tela",
		category: "Manos que Hacen",
		image_url: "/galeria/15.jpg",
		order_index: 15,
		is_active: true,
	},
	{
		title: "Deporte al Aire Libre",
		category: "Deporte",
		image_url: "/galeria/16.jpg",
		order_index: 16,
		is_active: true,
	},
	{
		title: "Terapia Asistida con Animales",
		category: "Terapia Canina",
		image_url: "/galeria/17.jpg",
		order_index: 17,
		is_active: true,
	},
	{
		title: "Terapia Asistida con Animales",
		category: "Terapia Canina",
		image_url: "/galeria/18.jpg",
		order_index: 18,
		is_active: true,
	},
	{
		title: "Terapia Asistida con Animales",
		category: "Terapia Canina",
		image_url: "/galeria/19.jpg",
		order_index: 19,
		is_active: true,
	},
	{
		title: "Terapia Asistida con Animales",
		category: "Terapia Canina",
		image_url: "/galeria/20.jpg",
		order_index: 20,
		is_active: true,
	},
];

function loadEnvLocal() {
	const envPath = resolve(process.cwd(), ".env.local");
	const content = readFileSync(envPath, "utf8");

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex === -1) continue;

		const key = trimmed.slice(0, separatorIndex).trim();
		const rawValue = trimmed.slice(separatorIndex + 1).trim();
		process.env[key] = rawValue.replace(/^["']|["']$/g, "");
	}
}

function assertNoError(error: { message: string } | null, step: string) {
	if (error) {
		throw new Error(`${step}: ${error.message}`);
	}
}

async function main() {
	loadEnvLocal();

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
		);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});

	const legacyUrls = galleryItems.map((item) => item.image_url);

	const upsertGallery = await supabase
		.from("gallery_items")
		.upsert(galleryItems, { onConflict: "image_url" });
	assertNoError(upsertGallery.error, "Upserting legacy gallery rows failed");

	const deleteStale = await supabase
		.from("gallery_items")
		.delete()
		.not("image_url", "in", `(${legacyUrls.join(",")})`);
	assertNoError(deleteStale.error, "Deleting stale gallery rows failed");

	const upsertFilters = await supabase.from("site_settings").upsert(
		{
			setting_group: "GALERIA",
			setting_key: "gallery_filter_labels",
			setting_value: JSON.stringify(filterLabels),
			setting_type: "JSON",
			description: "Lista de etiquetas visibles para filtros de galería",
		},
		{ onConflict: "setting_key" },
	);
	assertNoError(upsertFilters.error, "Updating gallery filter labels failed");

	const galleryReadback = await supabase
		.from("gallery_items")
		.select("title, category, image_url, order_index, is_active")
		.eq("is_active", true)
		.order("order_index", { ascending: true });
	assertNoError(galleryReadback.error, "Reading back gallery rows failed");

	const rows = galleryReadback.data ?? [];
	if (rows.length !== galleryItems.length) {
		throw new Error(
			`Expected ${galleryItems.length} active gallery rows, found ${rows.length}`,
		);
	}

	galleryItems.forEach((expected, index) => {
		const actual = rows[index];
		for (const key of [
			"title",
			"category",
			"image_url",
			"order_index",
			"is_active",
		] as const) {
			if (actual[key] !== expected[key]) {
				throw new Error(
					`Gallery mismatch at index ${index}, field ${key}: expected ${expected[key]}, received ${actual[key]}`,
				);
			}
		}
	});

	const filtersReadback = await supabase
		.from("site_settings")
		.select("setting_value, setting_type")
		.eq("setting_key", "gallery_filter_labels")
		.single();
	assertNoError(
		filtersReadback.error,
		"Reading back gallery filter labels failed",
	);

	if (filtersReadback.data?.setting_type !== "JSON") {
		throw new Error("gallery_filter_labels setting_type is not JSON");
	}

	if (filtersReadback.data.setting_value !== JSON.stringify(filterLabels)) {
		throw new Error(
			"gallery_filter_labels setting_value does not match expected labels",
		);
	}

	console.log(
		"Gallery update complete: 20 legacy rows active and filters updated.",
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

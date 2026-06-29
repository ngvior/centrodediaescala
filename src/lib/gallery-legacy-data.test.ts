import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const expectedFilterLabels = [
	"Todas",
	"Deporte",
	"Integración",
	"Terapias Ocupacionales",
	"Manos que Hacen",
	"Terapia Canina",
];

const expectedGalleryRows = [
	["Actividades Deportivas", "Deporte", "/galeria/1.jpg", 1],
	["Natación", "Deporte", "/galeria/2.jpg", 2],
	["Actividades con la Comunidad", "Integración", "/galeria/3.jpg", 3],
	["Salidas Recreativas", "Integración", "/galeria/4.jpg", 4],
	["Taller de Artesanías", "Terapias Ocupacionales", "/galeria/5.jpg", 5],
	["Taller de Creaciones en Papel", "Manos que Hacen", "/galeria/6.jpg", 6],
	["Creatividad", "Manos que Hacen", "/galeria/7.jpg", 7],
	["Tecnología", "Terapias Ocupacionales", "/galeria/8.jpg", 8],
	[
		"Taller de Creación de Máscaras de Teatro",
		"Terapias Ocupacionales",
		"/galeria/9.jpg",
		9,
	],
	["Cocina", "Terapias Ocupacionales", "/galeria/10.jpg", 10],
	["Música", "Terapias Ocupacionales", "/galeria/11.jpg", 11],
	[
		"Expresión Corporal y Teatro",
		"Terapias Ocupacionales",
		"/galeria/12.jpg",
		12,
	],
	["Participación en Ferias", "Integración", "/galeria/13.jpg", 13],
	["Serigrafía", "Terapias Ocupacionales", "/galeria/14.jpg", 14],
	["Taller de Pintura Sobre Tela", "Manos que Hacen", "/galeria/15.jpg", 15],
	["Deporte al Aire Libre", "Deporte", "/galeria/16.jpg", 16],
	["Terapia Asistida con Animales", "Terapia Canina", "/galeria/17.jpg", 17],
	["Terapia Asistida con Animales", "Terapia Canina", "/galeria/18.jpg", 18],
	["Terapia Asistida con Animales", "Terapia Canina", "/galeria/19.jpg", 19],
	["Terapia Asistida con Animales", "Terapia Canina", "/galeria/20.jpg", 20],
] as const;

function readProjectFile(filePath: string) {
	return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("gallery legacy data contract", () => {
	it("keeps seed filter labels aligned to canonical reachable categories", () => {
		const seedSql = readProjectFile("supabase/seed.sql");

		expect(seedSql).toContain(
			`'GALERIA', 'gallery_filter_labels', $$${JSON.stringify(expectedFilterLabels)}$$`,
		);
	});

	it("seeds the 20 legacy gallery rows with active flags and Deporte for item 16", () => {
		const seedSql = readProjectFile("supabase/seed.sql");

		expect(seedSql).toContain("DELETE FROM public.gallery_items;");
		expect(seedSql).not.toContain("/camina/2016/");
		expect(seedSql).not.toContain("'Deportivas', '/galeria/16.jpg'");

		for (const [title, category, imageUrl, orderIndex] of expectedGalleryRows) {
			expect(seedSql).toContain(
				`('${title}', '${category}', '${imageUrl}', ${orderIndex}, true)`,
			);
		}
	});

	it("keeps the live update script aligned to the same canonical data", () => {
		const scriptSource = readProjectFile("scripts/update-gallery.ts");

		expect(scriptSource).toContain("NEXT_PUBLIC_SUPABASE_URL");
		expect(scriptSource).toContain("SUPABASE_SERVICE_ROLE_KEY");
		expect(scriptSource).toContain(
			'upsert(galleryItems, { onConflict: "image_url" })',
		);
		expect(scriptSource).toContain('.not("image_url", "in"');
		expect(scriptSource).toContain("gallery_filter_labels");
		expect(scriptSource).not.toContain('category: "Deportivas"');

		for (const label of expectedFilterLabels) {
			expect(scriptSource).toContain(`\"${label}\"`);
		}

		for (const [title, category, imageUrl, orderIndex] of expectedGalleryRows) {
			expect(scriptSource).toContain(`title: \"${title}\"`);
			expect(scriptSource).toContain(`category: \"${category}\"`);
			expect(scriptSource).toContain(`image_url: \"${imageUrl}\"`);
			expect(scriptSource).toContain(`order_index: ${orderIndex}`);
		}
	});

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

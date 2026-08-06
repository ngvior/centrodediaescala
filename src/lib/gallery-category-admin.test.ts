import { describe, expect, it } from "vitest";

import {
	buildCategoryCascadeCopy,
	buildCategoryOptionLabel,
	countItemsByCategory,
	DUPLICATE_CATEGORY_NAME_MESSAGE,
	mapCategoryNameError,
} from "./gallery-category-admin";

/**
 * Only the fields the aggregation is allowed to read, plus `is_active` so the
 * "counts ignore visibility" cases have something to be ignored. Written as a
 * bare shape rather than an `AdminGalleryItem` on purpose: a fixture that
 * carried a name would let a future name-based implementation pass.
 */
type CountableItem = { category_id: string | null; is_active: boolean };

const ITEMS: CountableItem[] = [
	{ category_id: "category-deporte", is_active: true },
	{ category_id: "category-deporte", is_active: true },
	{ category_id: "category-deporte", is_active: false },
	{ category_id: "category-integracion", is_active: true },
	{ category_id: null, is_active: true },
	{ category_id: null, is_active: false },
];

describe("counting the photos bound to a category", () => {
	// The count beside a category and the {n} the dialog quotes come from this one
	// result, and the cascade behind the dialog runs on WHERE category_id with no
	// visibility predicate. Skipping hidden photos would under-report the change.
	it("counts a hidden photo the same as a visible one", () => {
		expect(countItemsByCategory(ITEMS).get("category-deporte")).toBe(3);
	});

	it("counts only the photos bound to that exact category", () => {
		expect(countItemsByCategory(ITEMS).get("category-integracion")).toBe(1);
	});

	// null is the absence of a binding, not a category of its own.
	it("gives an unbound photo to no category at all", () => {
		const counts = countItemsByCategory(ITEMS);

		expect([...counts.values()].reduce((total, n) => total + n, 0)).toBe(4);
		expect([...counts.keys()]).toEqual([
			"category-deporte",
			"category-integracion",
		]);
	});

	it("leaves a category nothing is bound to out of the map", () => {
		expect(countItemsByCategory(ITEMS).has("category-vacia")).toBe(false);
		expect(countItemsByCategory(ITEMS).get("category-vacia") ?? 0).toBe(0);
	});

	it("counts nothing when there are no photos", () => {
		expect(countItemsByCategory([]).size).toBe(0);
	});
});

describe("the delete warning dialog copy", () => {
	it("reads in the singular for one bound photo", () => {
		expect(buildCategoryCascadeCopy("delete", "Deporte", 1)).toEqual({
			title: "¿Eliminar “Deporte”?",
			body: "Esta categoría tiene 1 imagen asociada. Elegí qué hacer con ella:",
			keepLabel: "Mantener las imágenes sin categoría",
			keepHint:
				"Las 1 imágenes siguen en el listado, pero ya no podrán filtrarse por categoría.",
			purgeLabel: "Eliminar también las 1 imágenes",
			purgeHint:
				"Se borran del listado y de la galería pública. Esta acción no se puede deshacer.",
			confirmLabel: "Eliminar categoría",
		});
	});

	it("reads in the plural for several bound photos", () => {
		expect(buildCategoryCascadeCopy("delete", "Deporte", 3)).toEqual({
			title: "¿Eliminar “Deporte”?",
			body: "Esta categoría tiene 3 imágenes asociadas. Elegí qué hacer con ellas:",
			keepLabel: "Mantener las imágenes sin categoría",
			keepHint:
				"Las 3 imágenes siguen en el listado, pero ya no podrán filtrarse por categoría.",
			purgeLabel: "Eliminar también las 3 imágenes",
			purgeHint:
				"Se borran del listado y de la galería pública. Esta acción no se puede deshacer.",
			confirmLabel: "Eliminar categoría",
		});
	});
});

describe("the deactivate warning dialog copy", () => {
	it("reads in the singular for one bound photo", () => {
		expect(buildCategoryCascadeCopy("deactivate", "Deporte", 1)).toEqual({
			title: "¿Desactivar “Deporte”?",
			body: "Esta categoría tiene 1 imagen asociada. Elegí qué hacer con ella:",
			keepLabel: "Mantener las imágenes activas",
			keepHint:
				"Las 1 imágenes siguen visibles en la galería, sin filtro por esta categoría.",
			purgeLabel: "Desactivar también las 1 imágenes",
			purgeHint:
				"Podés reactivarlas de a una, o todas juntas al volver a activar la categoría.",
			confirmLabel: "Desactivar categoría",
		});
	});

	it("reads in the plural for several bound photos", () => {
		expect(buildCategoryCascadeCopy("deactivate", "Deporte", 4)).toEqual({
			title: "¿Desactivar “Deporte”?",
			body: "Esta categoría tiene 4 imágenes asociadas. Elegí qué hacer con ellas:",
			keepLabel: "Mantener las imágenes activas",
			keepHint:
				"Las 4 imágenes siguen visibles en la galería, sin filtro por esta categoría.",
			purgeLabel: "Desactivar también las 4 imágenes",
			purgeHint:
				"Podés reactivarlas de a una, o todas juntas al volver a activar la categoría.",
			confirmLabel: "Desactivar categoría",
		});
	});

	// The alternation is the body's alone. The hints read "Las {n} imágenes" even
	// at one, which is what the agreed reference says, so an over-eager
	// pluralisation fix has a test to fail against.
	it("alternates number only in the body, never in the option hints", () => {
		const singular = buildCategoryCascadeCopy("deactivate", "Deporte", 1);

		expect(singular.body).toContain("1 imagen asociada");
		expect(singular.keepHint).toContain("Las 1 imágenes");
		expect(singular.purgeLabel).toContain("las 1 imágenes");
	});

	it("quotes the category name in the title with the reference's curly quotes", () => {
		expect(buildCategoryCascadeCopy("delete", "Manos que Hacen", 2).title).toBe(
			"¿Eliminar “Manos que Hacen”?",
		);
	});
});

describe("the item form's category option label", () => {
	it("shows an active category by its bare name", () => {
		expect(
			buildCategoryOptionLabel({ name: "Deporte", is_active: true }),
		).toBe("Deporte");
	});

	// Selectable, but marked: a photo may legitimately belong to an archived
	// category, so the option stays and says so.
	it("marks an inactive category rather than hiding it", () => {
		expect(
			buildCategoryOptionLabel({ name: "Deporte", is_active: false }),
		).toBe("Deporte (inactiva)");
	});
});

describe("mapping a category write failure", () => {
	it("turns a unique violation into the administrator's message", () => {
		expect(mapCategoryNameError({ code: "23505" })).toBe(
			"Ya existe una categoría con ese nombre.",
		);
		expect(mapCategoryNameError({ code: "23505" })).toBe(
			DUPLICATE_CATEGORY_NAME_MESSAGE,
		);
	});

	// Anything else is an outage, not a name the administrator can fix. Returning
	// null is what keeps the caller on its generic-infra-error path, so Postgres
	// detail never reaches the browser.
	it.each([
		["a check-constraint violation", "23514"],
		["a foreign-key violation", "23503"],
		["a not-null violation", "23502"],
		["an undefined column", "42703"],
	])("does not map %s", (_case, code) => {
		expect(mapCategoryNameError({ code })).toBeNull();
	});

	it.each([
		["null", null],
		["undefined", undefined],
	])("does not map %s", (_case, error) => {
		expect(mapCategoryNameError(error)).toBeNull();
	});

	it("does not map an error carrying no code", () => {
		expect(mapCategoryNameError({})).toBeNull();
		expect(mapCategoryNameError({ code: null })).toBeNull();
	});

	// Text varies with the server's locale and version; the SQLSTATE does not. An
	// error whose message reads like a duplicate but whose code says otherwise
	// must not be mapped, and vice versa.
	it("matches the code, never the message text", () => {
		expect(
			mapCategoryNameError({
				code: "42501",
				message: "duplicate key value violates unique constraint",
			} as { code?: string | null }),
		).toBeNull();
		expect(
			mapCategoryNameError({
				code: "23505",
				message: "llave duplicada viola restricción de unicidad",
			} as { code?: string | null }),
		).toBe(DUPLICATE_CATEGORY_NAME_MESSAGE);
	});
});

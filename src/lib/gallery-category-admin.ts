/**
 * The decisions behind the admin gallery's Categories subsection: how many
 * photos each category holds, what the keep/purge warning dialog says, how a
 * category reads in the item form's picker, and which database failures are the
 * administrator's fault rather than an outage.
 *
 * All of it lives here rather than in `gallery-admin.tsx` for one reason: the
 * test runner is node-environment and collects only `.test.ts` files, so no
 * component ever renders. Logic left inside the `.tsx` is logic no test can
 * reach. The component is a shell over these four functions.
 */

/**
 * Counts the photos bound to each category, keyed by category id.
 *
 * Two rules, both load-bearing:
 *
 * - `is_active` is NOT consulted. A count beside a category must equal the `{n}`
 *   the warning dialog for that same category quotes, and the cascade the dialog
 *   triggers runs on `WHERE category_id = :id` with no visibility predicate. A
 *   count that skipped hidden photos would under-report what is about to change.
 * - An unbound photo (`category_id: null`) belongs to no category and is counted
 *   by none. `null` is deliberately not a key: it is the absence of a binding,
 *   not a category of its own.
 *
 * A category with nothing bound to it is simply absent from the map, so callers
 * read `counts.get(id) ?? 0`.
 */
export function countItemsByCategory(
	items: readonly { category_id: string | null }[],
): Map<string, number> {
	const counts = new Map<string, number>();

	for (const item of items) {
		if (item.category_id === null) {
			continue;
		}

		counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
	}

	return counts;
}

/** Which irreversible-ish operation the warning dialog is about to run. */
export type CategoryCascadeKind = "delete" | "deactivate";

/** What the administrator chose to do with the photos bound to the category. */
export type CategoryCascadeMode = "keep" | "purge";

export type CategoryCascadeCopy = {
	title: string;
	body: string;
	keepLabel: string;
	keepHint: string;
	purgeLabel: string;
	purgeHint: string;
	confirmLabel: string;
};

/**
 * The Spanish shown by the keep/purge warning dialog, verbatim from the agreed
 * reference. Singular and plural alternate exactly where the reference has them
 * — the body's `imagen asociada`/`imágenes asociadas` and `ella`/`ellas` — and
 * nowhere else: the option hints say `Las {n} imágenes` even at one, which is
 * what the reference reads.
 *
 * The dialog only ever opens with at least one bound photo, so n = 1 is the
 * smallest case this has to render.
 */
export function buildCategoryCascadeCopy(
	kind: CategoryCascadeKind,
	name: string,
	count: number,
): CategoryCascadeCopy {
	const isSingular = count === 1;
	const subject = isSingular ? "imagen asociada" : "imágenes asociadas";
	const pronoun = isSingular ? "ella" : "ellas";
	const body = `Esta categoría tiene ${count} ${subject}. Elegí qué hacer con ${pronoun}:`;

	if (kind === "delete") {
		return {
			title: `¿Eliminar “${name}”?`,
			body,
			keepLabel: "Mantener las imágenes sin categoría",
			keepHint: `Las ${count} imágenes siguen en el listado, pero ya no podrán filtrarse por categoría.`,
			purgeLabel: `Eliminar también las ${count} imágenes`,
			purgeHint:
				"Se borran del listado y de la galería pública. Esta acción no se puede deshacer.",
			confirmLabel: "Eliminar categoría",
		};
	}

	return {
		title: `¿Desactivar “${name}”?`,
		body,
		keepLabel: "Mantener las imágenes activas",
		keepHint: `Las ${count} imágenes siguen visibles en la galería, sin filtro por esta categoría.`,
		purgeLabel: `Desactivar también las ${count} imágenes`,
		purgeHint:
			"Podés reactivarlas de a una, o todas juntas al volver a activar la categoría.",
		confirmLabel: "Desactivar categoría",
	};
}

/**
 * How a category reads in the item form's picker.
 *
 * An inactive category stays selectable — a photo may legitimately belong to an
 * archived category — so it is marked rather than removed.
 */
export function buildCategoryOptionLabel(category: {
	name: string;
	is_active: boolean;
}): string {
	return category.is_active ? category.name : `${category.name} (inactiva)`;
}

/**
 * The Spanish shown when a category name collides with an existing one,
 * case-insensitively.
 *
 * `gallery_categories_name_lower_key` is the authority: a pre-check `SELECT`
 * would be racy, and the unique index catches the race the check cannot.
 */
export const DUPLICATE_CATEGORY_NAME_MESSAGE =
	"Ya existe una categoría con ese nombre.";

/**
 * Turns a Postgres failure into the administrator's message, or `null` when it
 * is not theirs to fix.
 *
 * Matching is on the SQLSTATE code, never on the message text: `23505` is the
 * stable `unique_violation` code that PostgrestError carries, while the message
 * varies with the server's locale and version. `null` means "not a name
 * collision" and leaves the caller to raise its generic infrastructure error, so
 * an unmapped failure never reaches the browser as raw Postgres detail.
 */
export function mapCategoryNameError(
	error: { code?: string | null } | null | undefined,
): string | null {
	return error?.code === "23505" ? DUPLICATE_CATEGORY_NAME_MESSAGE : null;
}

"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableVerticalList } from "@/components/admin/sortable-vertical-list";
import { cn } from "@/lib/utils";
import { NAVIGATION_SECTIONS } from "@/lib/site-settings";

/**
 * Friendly editor for the header_navigation JSON setting. Each row is a free-text
 * link label plus a SELECT of friendly site sections; rows can be added, removed
 * and drag-reordered. The result serializes to a `{ label, href }[]` JSON hidden
 * input, so malformed JSON / unknown structure is structurally impossible.
 *
 * The select only offers {@link NAVIGATION_SECTIONS} — anchors that ACTUALLY
 * exist in the public page (correction #2). A stored row whose href is NOT one of
 * those (a legacy anchor such as #institucion that the page never renders) is
 * preserved as a per-row "(enlace heredado: …)" option, preselected, so the value
 * round-trips on save without forcing the admin to silently turn it into a dead
 * link. Switching that row to a real section drops the legacy option.
 */

type Row = { id: string; label: string; href: string };

const CANONICAL_HREFS = new Set(NAVIGATION_SECTIONS.map((section) => section.href));

const SELECT_CLASS = cn(
	"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
	"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
);

/** Parse the stored JSON into `{ label, href }` rows, tolerating malformed data. */
function parseItems(defaultValue: string): Array<{ label: string; href: string }> {
	if (defaultValue.trim().length === 0) return [];
	try {
		const parsed: unknown = JSON.parse(defaultValue);
		if (!Array.isArray(parsed)) return [];
		const items: Array<{ label: string; href: string }> = [];
		for (const item of parsed) {
			if (item && typeof item === "object") {
				const label = (item as Record<string, unknown>).label;
				const href = (item as Record<string, unknown>).href;
				if (typeof label === "string" && typeof href === "string") {
					items.push({ label, href });
				}
			}
		}
		return items;
	} catch {
		return [];
	}
}

/**
 * Options shown for a row. When the row's href is not one of the canonical
 * sections (a preserved legacy anchor), append it as a labelled extra option so
 * the value stays selectable and round-trips.
 */
function optionsForRow(href: string): ReadonlyArray<{ href: string; label: string }> {
	if (CANONICAL_HREFS.has(href)) return NAVIGATION_SECTIONS;
	return [...NAVIGATION_SECTIONS, { href, label: `(enlace heredado: ${href})` }];
}

type NavigationEditorProps = {
	/** Form field name for the hidden input carrying the serialized JSON. */
	name: string;
	/** Stored JSON array string to hydrate from. */
	defaultValue?: string;
	id?: string;
};

export function NavigationEditor({
	name,
	defaultValue = "",
	id,
}: NavigationEditorProps) {
	// Deterministic incrementing ids so SSR and client hydration agree. Initial
	// rows use index-based ids; the counter (seeded past them) only advances
	// inside event handlers, never during render.
	const [rows, setRows] = useState<Row[]>(() => {
		const items = parseItems(defaultValue);
		const initial =
			items.length > 0
				? items
				: [{ label: "", href: NAVIGATION_SECTIONS[0].href }];
		return initial.map((item, index) => ({ id: `row-${index}`, ...item }));
	});
	const idCounter = useRef(rows.length);
	const makeId = () => {
		const next = `row-${idCounter.current}`;
		idCounter.current += 1;
		return next;
	};

	const value = JSON.stringify(
		rows.map((row) => ({ label: row.label.trim(), href: row.href })),
	);
	const hasEmptyLabel = rows.some((row) => row.label.trim().length === 0);

	function updateLabel(rowId: string, label: string) {
		setRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, label } : row)),
		);
	}

	function updateHref(rowId: string, href: string) {
		setRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, href } : row)),
		);
	}

	function addRow() {
		setRows((prev) => [
			...prev,
			{ id: makeId(), label: "", href: NAVIGATION_SECTIONS[0].href },
		]);
	}

	function removeRow(rowId: string) {
		setRows((prev) =>
			prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId),
		);
	}

	function reorder(orderedIds: string[]) {
		setRows((prev) => {
			const byId = new Map(prev.map((row) => [row.id, row]));
			return orderedIds
				.map((rowId) => byId.get(rowId))
				.filter((row): row is Row => row !== undefined);
		});
	}

	return (
		<div id={id} className="flex flex-col gap-2">
			<SortableVerticalList
				items={rows}
				getId={(row) => row.id}
				onReorder={reorder}
				renderItem={(row, handle) => {
					const labelEmpty = row.label.trim().length === 0;
					return (
						<>
							{handle}
							<Input
								aria-label="Texto del enlace"
								placeholder="Texto del enlace"
								aria-invalid={labelEmpty || undefined}
								value={row.label}
								onChange={(event) => updateLabel(row.id, event.target.value)}
								className="flex-1"
							/>
							<select
								aria-label="Sección de destino"
								className={cn(SELECT_CLASS, "flex-1")}
								value={row.href}
								onChange={(event) => updateHref(row.id, event.target.value)}
							>
								{optionsForRow(row.href).map((option) => (
									<option key={option.href} value={option.href}>
										{option.label}
									</option>
								))}
							</select>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Eliminar enlace"
								disabled={rows.length <= 1}
								onClick={() => removeRow(row.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</>
					);
				}}
			/>

			<div className="flex items-center justify-between gap-2">
				<Button type="button" variant="outline" size="sm" onClick={addRow}>
					<Plus className="h-4 w-4" /> Agregar enlace
				</Button>
				{hasEmptyLabel ? (
					<p className="text-sm text-destructive">
						Cada enlace necesita un texto visible.
					</p>
				) : null}
			</div>

			<input type="hidden" name={name} value={value} readOnly />
		</div>
	);
}

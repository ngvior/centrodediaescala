"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableVerticalList } from "@/components/admin/sortable-vertical-list";

/**
 * Friendly editor for the JSON string-list site settings (about_compliance_items,
 * about_requirements_items, gallery_filter_labels). Rows of text inputs with
 * add / remove / drag-reorder. The trimmed, non-empty rows are serialized to a
 * hidden JSON input ("setting_value"), so the admin can never produce malformed
 * JSON — only a well-formed `string[]`.
 *
 * Enforces the `assertStringList` contract (non-empty array of non-empty trimmed
 * strings): removal of the last remaining row is disabled, and an inline message
 * appears when no row has content. Final authority still comes from the server
 * ActionResult, but the UI makes the malformed-JSON error class structurally
 * impossible.
 */

type Row = { id: string; value: string };

/** Parse the stored JSON into plain strings, tolerating malformed/legacy data. */
function parseItems(defaultValue: string): string[] {
	if (defaultValue.trim().length === 0) return [];
	try {
		const parsed: unknown = JSON.parse(defaultValue);
		if (Array.isArray(parsed)) {
			return parsed.filter((item): item is string => typeof item === "string");
		}
	} catch {
		// Malformed stored JSON: start from a single empty row rather than crash.
	}
	return [];
}

type StringListEditorProps = {
	/** Form field name for the hidden input carrying the serialized JSON. */
	name: string;
	/** Stored JSON array string to hydrate from. */
	defaultValue?: string;
	ariaLabel: string;
	id?: string;
	/** Singular noun used in a11y labels and the add button, e.g. "ítem". */
	itemLabel?: string;
};

export function StringListEditor({
	name,
	defaultValue = "",
	ariaLabel,
	id,
	itemLabel = "ítem",
}: StringListEditorProps) {
	// Deterministic incrementing ids (no crypto.randomUUID) so SSR and client
	// hydration produce identical keys — no hydration mismatch. Initial rows use
	// index-based ids; the counter (seeded past them) only advances inside event
	// handlers, never during render.
	const [rows, setRows] = useState<Row[]>(() => {
		const items = parseItems(defaultValue);
		const initial = items.length > 0 ? items : [""];
		return initial.map((value, index) => ({ id: `row-${index}`, value }));
	});
	const idCounter = useRef(rows.length);
	const makeId = () => {
		const next = `row-${idCounter.current}`;
		idCounter.current += 1;
		return next;
	};

	const value = JSON.stringify(
		rows.map((row) => row.value.trim()).filter((item) => item.length > 0),
	);
	const isEmpty = value === "[]";

	function updateRow(rowId: string, next: string) {
		setRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, value: next } : row)),
		);
	}

	function addRow() {
		setRows((prev) => [...prev, { id: makeId(), value: "" }]);
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
				renderItem={(row, handle) => (
					<>
						{handle}
						<Input
							aria-label={`${ariaLabel} (${itemLabel})`}
							value={row.value}
							onChange={(event) => updateRow(row.id, event.target.value)}
							className="flex-1"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Eliminar ${itemLabel}`}
							disabled={rows.length <= 1}
							onClick={() => removeRow(row.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</>
				)}
			/>

			<div className="flex items-center justify-between gap-2">
				<Button type="button" variant="outline" size="sm" onClick={addRow}>
					<Plus className="h-4 w-4" /> Agregar {itemLabel}
				</Button>
				{isEmpty ? (
					<p className="text-sm text-destructive">
						Agregá al menos un {itemLabel}.
					</p>
				) : null}
			</div>

			<input type="hidden" name={name} value={value} readOnly />
		</div>
	);
}

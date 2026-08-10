"use client";

import { Pencil, Power, Trash2 } from "lucide-react";

/**
 * A gallery category as a chip: its name, how many photos are bound to it, and
 * the four things an administrator can do to it.
 *
 * Deliberately NOT shared with the interviews filter chip. The two look alike
 * from a distance, but this one carries per-item controls, a three-state
 * palette keyed on the category's own active flag, and no status dot. Merging
 * them on that resemblance would produce a component whose props are the union
 * of two unrelated jobs; they are allowed to look similar and stay separate.
 *
 * Presentational only. Every control reports upward and this component owns no
 * dialog, no transition, and no server call.
 */

/**
 * Palette from the agreed admin reference. Deliberately not the public
 * gallery's orange `#ff7e2e`, which stays a visitor-facing colour.
 */
const CHIP_PALETTE = {
	/** Active but not the current filter. */
	active: {
		backgroundColor: "#e9f7ef",
		borderColor: "#c5e8d3",
		color: "#1a7f4b",
	},
	/** Active and driving the current filter. */
	selected: {
		backgroundColor: "#e3f2fd",
		borderColor: "#3fa0e0",
		color: "#14608f",
		boxShadow: "0 0 0 3px rgba(63,160,224,.18)",
	},
	/** Not shown in the public gallery at all. */
	inactive: {
		backgroundColor: "#f7f8fa",
		borderColor: "#dfe3e8",
		color: "#8b93a0",
	},
} as const;

type GalleryCategoryChipProps = {
	name: string;
	/** Photos bound to this category, counted regardless of their own visibility. */
	count: number;
	isActive: boolean;
	isSelected: boolean;
	/** Disables every control while a cascade for this category is in flight. */
	pending?: boolean;
	onSelect: () => void;
	onEdit: () => void;
	onToggle: () => void;
	onDelete: () => void;
};

export function GalleryCategoryChip({
	name,
	count,
	isActive,
	isSelected,
	pending = false,
	onSelect,
	onEdit,
	onToggle,
	onDelete,
}: GalleryCategoryChipProps) {
	// An inactive category reads as inactive even while it is the current filter:
	// its absence from the public gallery is the more important fact.
	const palette = !isActive
		? CHIP_PALETTE.inactive
		: isSelected
			? CHIP_PALETTE.selected
			: CHIP_PALETTE.active;

	return (
		<div
			className="inline-flex items-center gap-1 rounded-full border-[1.5px] py-1 pr-1.5 pl-3 text-sm font-bold transition-all duration-[120ms]"
			style={palette}
		>
			<button
				type="button"
				title="Filtrar por esta categoría"
				aria-pressed={isSelected}
				disabled={pending}
				onClick={onSelect}
				className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
			>
				{name}
				<span className="rounded-full bg-white/70 px-[7px] py-px text-[11.5px] font-extrabold">
					{count}
				</span>
				{isActive ? null : (
					<span className="text-[11.5px] font-semibold italic">inactiva</span>
				)}
			</button>
			<span className="flex items-center">
				<button
					type="button"
					title="Editar categoría"
					disabled={pending}
					onClick={onEdit}
					className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Pencil className="h-3.5 w-3.5" aria-hidden />
					<span className="sr-only">Editar categoría</span>
				</button>
				<button
					type="button"
					title={isActive ? "Desactivar categoría" : "Activar categoría"}
					disabled={pending}
					onClick={onToggle}
					className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Power className="h-3.5 w-3.5" aria-hidden />
					<span className="sr-only">
						{isActive ? "Desactivar categoría" : "Activar categoría"}
					</span>
				</button>
				<button
					type="button"
					title="Eliminar categoría"
					disabled={pending}
					onClick={onDelete}
					className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Trash2 className="h-3.5 w-3.5" aria-hidden />
					<span className="sr-only">Eliminar categoría</span>
				</button>
			</span>
		</div>
	);
}

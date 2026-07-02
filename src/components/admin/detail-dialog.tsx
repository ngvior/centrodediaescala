import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export type DetailField = {
	label: string;
	value: ReactNode;
};

type DetailDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	fields: DetailField[];
	/** Optional protagonist image rendered beside the fields (e.g. lightbox). */
	image?: ReactNode;
	onEdit: () => void;
	onDelete: () => void;
	closeLabel?: string;
	editLabel?: string;
	deleteLabel?: string;
};

/**
 * Controlled read-only detail view for an admin record. It is a new entry
 * point into the island's EXISTING controlled edit/delete dialogs — `onEdit`
 * and `onDelete` are wired by the caller to open those, so there is no
 * duplication of the edit form or delete flow here.
 *
 * The caller owns `open`/`onOpenChange` and builds the `fields` from the
 * record. Footer: Cerrar (DialogClose, outline), Editar (secondary),
 * Eliminar (solid red, per the locked visual decision).
 */
export function DetailDialog({
	open,
	onOpenChange,
	title,
	fields,
	image,
	onEdit,
	onDelete,
	closeLabel = "Cerrar",
	editLabel = "Editar",
	deleteLabel = "Eliminar",
}: DetailDialogProps) {
	const definitionList = (
		<dl className="grid gap-3.5">
			{fields.map((field) => (
				<div key={field.label}>
					<dt className="text-[10.5px] font-black tracking-[0.09em] text-muted-foreground uppercase">
						{field.label}
					</dt>
					<dd className="text-sm">{field.value}</dd>
				</div>
			))}
		</dl>
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-white sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{image ? (
					<div className="grid gap-5 sm:grid-cols-[176px_1fr]">
						{image}
						{definitionList}
					</div>
				) : (
					definitionList
				)}
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						{closeLabel}
					</DialogClose>
					<Button variant="secondary" onClick={onEdit}>
						{editLabel}
					</Button>
					<Button
						variant="destructive"
						className="bg-destructive text-white hover:bg-destructive/90"
						onClick={onDelete}
					>
						{deleteLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

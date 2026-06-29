import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void | Promise<void>;
	pending?: boolean;
	destructive?: boolean;
};

/**
 * Controlled confirmation dialog built on the shared Base UI Dialog wrappers.
 * The caller owns `open`/`onOpenChange` and runs the side effect in
 * `onConfirm` (typically submitting a delete server action). While `pending`
 * is true both actions are disabled and the confirm button shows a spinner.
 */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	onConfirm,
	pending = false,
	destructive = false,
}: ConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="outline" disabled={pending} />}
					>
						{cancelLabel}
					</DialogClose>
					<Button
						variant={destructive ? "destructive" : "default"}
						disabled={pending}
						onClick={() => onConfirm()}
					>
						{pending ? (
							<Loader2 className="animate-spin" aria-hidden="true" />
						) : null}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

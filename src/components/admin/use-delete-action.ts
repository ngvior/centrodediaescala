"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DeleteAction = (formData: FormData) => Promise<void>;

/**
 * Drives the delete-confirmation flow for an admin row: owns the confirm
 * dialog's open state and the pending transition, builds the `{ id }` FormData,
 * and closes the dialog on success. On failure we `router.refresh()` so the row
 * reappears with the server's authoritative state.
 */
export function useDeleteAction(deleteAction: DeleteAction) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, startDelete] = useTransition();
	const router = useRouter();

	function handleDelete(id: string) {
		const formData = new FormData();
		formData.set("id", id);
		startDelete(async () => {
			try {
				await deleteAction(formData);
				setConfirmOpen(false);
			} catch {
				router.refresh();
			}
		});
	}

	return { confirmOpen, setConfirmOpen, isDeleting, handleDelete } as const;
}

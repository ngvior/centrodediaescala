"use client";

import { useActionState, useState } from "react";

import type { ActionResult } from "@/actions/admin";

const IDLE_STATE: ActionResult = { status: "idle" };

type EntityAction = (
	prevState: ActionResult,
	formData: FormData,
) => Promise<ActionResult>;

/**
 * Wires a create/update server action to `useActionState` and a controlled
 * dialog. The dialog closes automatically when the action resolves with
 * `status: "success"` — the action's internal `revalidatePath` then re-renders
 * the server page and feeds fresh items back into the island. Errors stay in
 * `state` so the form can surface a message without closing.
 *
 * Close-on-success is reconciled during render (not in an effect): each
 * dispatch from `useActionState` yields a new state object, so comparing it to
 * the last-seen state lets us react to the completed submission exactly once.
 * This mirrors the "adjusting state during render" pattern used by SortableList
 * and avoids the cascading-render effect lint rule.
 */
export function useActionDialog(action: EntityAction) {
	const [state, formAction, isPending] = useActionState(action, IDLE_STATE);
	const [open, setOpen] = useState(false);
	const [seenState, setSeenState] = useState(state);

	if (state !== seenState) {
		setSeenState(state);
		if (state.status === "success") {
			setOpen(false);
		}
	}

	const errorMessage = state.status === "error" ? state.message : null;

	return { formAction, isPending, open, setOpen, errorMessage } as const;
}

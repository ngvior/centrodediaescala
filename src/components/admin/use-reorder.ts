"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { reorderRecords, type ReorderableTable } from "@/actions/admin";

/**
 * Wires drag-and-drop reordering for an admin list to `reorderRecords`. The
 * reorder is optimistic (SortableTable already moved the rows locally); on
 * failure we `router.refresh()` to pull the server's authoritative order back.
 */
export function useReorder(table: ReorderableTable) {
	const [isReordering, startReorder] = useTransition();
	const router = useRouter();

	function handleReorder(orderedIds: string[]) {
		startReorder(async () => {
			try {
				await reorderRecords(table, orderedIds);
			} catch {
				router.refresh();
			}
		});
	}

	return { handleReorder, isReordering } as const;
}

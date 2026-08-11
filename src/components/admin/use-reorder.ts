"use client";

import { useRouter } from "next/navigation";

import { reorderRecords, type ReorderableTable } from "@/actions/admin";

/**
 * Wires drag-and-drop reordering for an admin list to `reorderRecords`. The
 * reorder is optimistic (SortableTable already moved the rows locally); on
 * failure we `router.refresh()` to pull the server's authoritative order back.
 */
export function useReorder(table: ReorderableTable) {
	const router = useRouter();

	async function handleReorder(orderedIds: string[]) {
		try {
			await reorderRecords(table, orderedIds);
		} catch {
			router.refresh();
		}
	}

	return { handleReorder } as const;
}

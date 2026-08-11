import {
	type ReactNode,
	createContext,
	startTransition,
	useContext,
	useOptimistic,
} from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { TableRow } from "@/components/ui/table";

/**
 * The built <SortableContext>+rows node, shared from the provider
 * (<SortableTable>) down to the body part (<SortableTableRows>) via React
 * context. Using a ReactNode-valued context keeps the provider generic-free
 * while letting the rows mount inside the <tbody> even though the DndContext
 * lives outside the table.
 */
const SortableRowsContext = createContext<ReactNode>(null);

type SortableTableProps<T> = {
	items: T[];
	getId: (item: T) => string;
	onReorder: (orderedIds: string[]) => void | Promise<void>;
	/**
	 * Renders the cells for one row. The returned node is placed inside a
	 * <tr>, so it should be the row's <td> cells. `handle` is the drag handle —
	 * render it inside one of the cells. `index` is the displayed position (0-indexed).
	 */
	renderRow: (item: T, handle: ReactNode, index: number) => ReactNode;
	children: ReactNode;
};

/**
 * Provider for drag-to-reorder tables built on dnd-kit. It renders the
 * <DndContext> OUTSIDE the <table> (wrapping the Card/Table passed as
 * `children`) and exposes the built rows through {@link SortableRowsContext};
 * the table body mounts them via <SortableTableRows /> inside <tbody>.
 *
 * dnd-kit's <DndContext> emits two accessibility <div>s at its own location.
 * Rendering it outside the table keeps those <div>s as valid siblings instead
 * of invalid children of <tbody> (the prior hydration bug). <SortableContext>
 * emits no DOM and React context follows tree position, so each row's
 * useSortable is still correctly scoped under DndContext + SortableContext.
 *
 * Reordering is optimistic via React's `useOptimistic`: the new order is applied
 * optimistically inside a transition that awaits `onReorder(orderedIds)`. React
 * holds the optimistic order until the action and RSC revalidation commit, or
 * automatically reverts to server order on failure.
 */
export function SortableTable<T>({
	items,
	getId,
	onReorder,
	renderRow,
	children,
}: SortableTableProps<T>) {
	const incomingIds = items.map(getId);

	const [optimisticIds, applyOptimisticIds] = useOptimistic(
		incomingIds,
		(_prev, next: string[]) => next,
	);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const itemById = new Map(items.map((item) => [getId(item), item]));
	const orderedItems = optimisticIds
		.map((id) => itemById.get(id))
		.filter((item): item is T => item !== undefined);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = optimisticIds.indexOf(String(active.id));
		const newIndex = optimisticIds.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		const nextOrder = arrayMove(optimisticIds, oldIndex, newIndex);
		startTransition(async () => {
			applyOptimisticIds(nextOrder);
			await onReorder(nextOrder);
		});
	}

	const rows = (
		<SortableContext items={optimisticIds} strategy={verticalListSortingStrategy}>
			{orderedItems.map((item, index) => (
				<SortableRow key={getId(item)} id={getId(item)}>
					{(handle) => renderRow(item, handle, index)}
				</SortableRow>
			))}
		</SortableContext>
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableRowsContext.Provider value={rows}>
				{children}
			</SortableRowsContext.Provider>
		</DndContext>
	);
}

/**
 * Renders the sortable rows produced by the enclosing {@link SortableTable}.
 * Place this inside <TableBody> so the <tr> rows mount as valid children of
 * <tbody>; the DndContext accessibility <div>s stay outside the table.
 */
export function SortableTableRows() {
	return <>{useContext(SortableRowsContext)}</>;
}

type SortableRowProps = {
	id: string;
	children: (handle: ReactNode) => ReactNode;
};

function SortableRow({ id, children }: SortableRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	const handle = (
		<button
			type="button"
			className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
			aria-label="Reordenar"
			{...attributes}
			{...listeners}
		>
			<GripVertical className="h-4 w-4" />
		</button>
	);

	return (
		<TableRow ref={setNodeRef} style={style}>
			{children(handle)}
		</TableRow>
	);
}

import {
	type ReactNode,
	createContext,
	useContext,
	useState,
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
	onReorder: (orderedIds: string[]) => void;
	/**
	 * Renders the cells for one row. The returned node is placed inside a
	 * <tr>, so it should be the row's <td> cells. `handle` is the drag handle —
	 * render it inside one of the cells.
	 */
	renderRow: (item: T, handle: ReactNode) => ReactNode;
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
 * Reordering is optimistic: the new order is applied locally on drag end and
 * reported via `onReorder(orderedIds)`. When the parent re-renders with a
 * different `items` order (e.g. after the server action revalidates, or
 * reverts on failure), the local order re-syncs to the incoming props.
 */
export function SortableTable<T>({
	items,
	getId,
	onReorder,
	renderRow,
	children,
}: SortableTableProps<T>) {
	const incomingIds = items.map(getId);
	const incomingSignature = incomingIds.join(" ");

	const [orderedIds, setOrderedIds] = useState(incomingIds);
	const [syncedSignature, setSyncedSignature] = useState(incomingSignature);

	// Re-sync optimistic order when the parent provides a new set/order.
	// (Adjusting state during render per the React "you might not need an
	// effect" pattern — avoids a flash from a post-render effect.)
	if (incomingSignature !== syncedSignature) {
		setOrderedIds(incomingIds);
		setSyncedSignature(incomingSignature);
	}

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const itemById = new Map(items.map((item) => [getId(item), item]));
	const orderedItems = orderedIds
		.map((id) => itemById.get(id))
		.filter((item): item is T => item !== undefined);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = orderedIds.indexOf(String(active.id));
		const newIndex = orderedIds.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		const nextOrder = arrayMove(orderedIds, oldIndex, newIndex);
		setOrderedIds(nextOrder);
		setSyncedSignature(nextOrder.join(" "));
		onReorder(nextOrder);
	}

	const rows = (
		<SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
			{orderedItems.map((item) => (
				<SortableRow key={getId(item)} id={getId(item)}>
					{(handle) => renderRow(item, handle)}
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
		<tr ref={setNodeRef} style={style}>
			{children(handle)}
		</tr>
	);
}

import { type ReactNode, useId } from "react";
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

type SortableVerticalListProps<T> = {
	items: T[];
	getId: (item: T) => string;
	/**
	 * Called with the reordered ids on drag end. The list is purely local /
	 * optimistic — there is NO per-drag server persistence (unlike the admin
	 * tables that use {@link useReorder}). The parent editor keeps the order in
	 * its own row state and only persists it on FORM SUBMIT via the reserialized
	 * hidden input.
	 */
	onReorder: (orderedIds: string[]) => void;
	/**
	 * Renders one row. `handle` is the drag handle button — place it inside the
	 * row (typically first) so the whole row does not become draggable.
	 */
	renderItem: (item: T, handle: ReactNode) => ReactNode;
};

/**
 * Minimal drag-to-reorder for a plain vertical list (no <table>, so none of the
 * portal/context gymnastics that {@link SortableTable} needs for <tbody>).
 *
 * dnd-kit's <DndContext> renders two accessibility <div>s at its own location;
 * here that location is a normal block element, so they are valid siblings of
 * the rows. Reordering reports the new id order via `onReorder`; the parent is
 * the source of truth and re-renders with the new `items` order.
 *
 * Shared by StringListEditor (T5) and NavigationEditor (T6).
 */
export function SortableVerticalList<T>({
	items,
	getId,
	onReorder,
	renderItem,
}: SortableVerticalListProps<T>) {
	// Stable, hydration-safe id for the DndContext. Without it, dnd-kit derives
	// the `aria-describedby="DndDescribedBy-{n}"` from a module-global counter
	// that advances in a different order on the server vs. client hydration when
	// several DndContexts share a page (the config page has 4), causing a
	// hydration mismatch. useId() produces the same value on both sides.
	const dndContextId = useId();
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const ids = items.map(getId);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = ids.indexOf(String(active.id));
		const newIndex = ids.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		onReorder(arrayMove(ids, oldIndex, newIndex));
	}

	return (
		<DndContext
			id={dndContextId}
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<div className="flex flex-col gap-2">
					{items.map((item) => (
						<SortableVerticalRow key={getId(item)} id={getId(item)}>
							{(handle) => renderItem(item, handle)}
						</SortableVerticalRow>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

type SortableVerticalRowProps = {
	id: string;
	children: (handle: ReactNode) => ReactNode;
};

function SortableVerticalRow({ id, children }: SortableVerticalRowProps) {
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
		<div ref={setNodeRef} style={style} className="flex items-center gap-2">
			{children(handle)}
		</div>
	);
}

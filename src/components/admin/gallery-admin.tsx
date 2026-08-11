"use client";

import { type ReactNode, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Eye, ImageIcon, Plus, Trash2 } from "lucide-react";

import {
	createGalleryCategory,
	createGalleryItem,
	deleteGalleryCategory,
	deleteGalleryItem,
	setGalleryCategoryActive,
	updateGalleryCategory,
	updateGalleryItem,
	type AdminGalleryCategory,
	type AdminGalleryItem,
} from "@/actions/admin";
import {
	buildCategoryCascadeCopy,
	buildCategoryOptionLabel,
	countItemsByCategory,
	type CategoryCascadeKind,
	type CategoryCascadeMode,
} from "@/lib/gallery-category-admin";
import { filterByCategoryId } from "@/lib/gallery-filter";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	DetailDialog,
	type DetailField,
} from "@/components/admin/detail-dialog";
import { FormError } from "@/components/admin/form-error";
import { GalleryCategoryChip } from "@/components/admin/gallery-category-chip";
import { ImageLightbox } from "@/components/admin/image-lightbox";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { SortableTable, SortableTableRows } from "@/components/admin/sortable-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionDialog } from "@/components/admin/use-action-dialog";
import { useDeleteAction } from "@/components/admin/use-delete-action";
import { useReorder } from "@/components/admin/use-reorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const COLUMN_COUNT = 4;

/** Shown in the Categoría cell and the picker for a photo bound to nothing. */
const UNBOUND_CATEGORY_LABEL = "Sin categoría";

const SELECT_CLASS =
	"h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function GalleryFormFields({
	item,
	categories,
}: {
	item?: AdminGalleryItem;
	categories: AdminGalleryCategory[];
}) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium">Título</label>
					<Input name="title" defaultValue={item?.title} required />
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Categoría</label>
					{/*
					  A selection, never free text: typing the name is what let
					  `Categoria` and `categoria` coexist in production. The server
					  derives the stored legacy text from whichever id is picked here,
					  so the two columns cannot disagree. An inactive category stays
					  selectable — a photo may legitimately belong to an archived one.
					*/}
					<select
						name="category_id"
						defaultValue={item?.category_id ?? ""}
						className={SELECT_CLASS}
					>
						<option value="">{UNBOUND_CATEGORY_LABEL}</option>
						{categories.map((category) => (
							<option key={category.id} value={category.id}>
								{buildCategoryOptionLabel(category)}
							</option>
						))}
					</select>
				</div>
			</div>
			<ImageUploadField existingUrl={item?.image_url} required={!item} optimize />
		</>
	);
}

function GalleryRow({
	item,
	handle,
	categories,
	index,
}: {
	item: AdminGalleryItem;
	/** Null while the list is filtered — reordering a subset is unsafe. */
	handle: ReactNode;
	categories: AdminGalleryCategory[];
	index: number;
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(updateGalleryItem);
	const { confirmOpen, setConfirmOpen, isDeleting, handleDelete } =
		useDeleteAction(deleteGalleryItem);
	const [detailOpen, setDetailOpen] = useState(false);

	const categoryLabel = item.category ?? UNBOUND_CATEGORY_LABEL;

	const detailFields: DetailField[] = [
		{ label: "Título", value: item.title },
		{ label: "Categoría", value: categoryLabel },
		{ label: "Estado", value: <StatusBadge active={item.is_active} /> },
	];

	return (
		<>
			<TableCell className="w-10 font-mono text-xs text-muted-foreground">
				{index + 1}
			</TableCell>
			<TableCell className="w-10">{handle}</TableCell>
			<TableCell>
				<div className="flex items-center gap-3">
					<ImageLightbox
						src={item.image_url}
						alt=""
						title={item.title}
						className="h-12 w-16 rounded-[10px] object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50"
					/>
					<span className="font-medium">{item.title}</span>
				</div>
			</TableCell>
			<TableCell>{categoryLabel}</TableCell>
			<TableCell>
				<span
					className={
						item.is_active
							? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
							: "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
					}
				>
					{item.is_active ? "Activo" : "Inactivo"}
				</span>
			</TableCell>
			<TableCell className="text-right">
				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-primary"
						onClick={() => setDetailOpen(true)}
					>
						<Eye className="h-4 w-4" />
						<span className="sr-only">Ver detalle</span>
					</Button>
					<DetailDialog
						open={detailOpen}
						onOpenChange={setDetailOpen}
						title={item.title}
						fields={detailFields}
						image={
							<ImageLightbox
								src={item.image_url}
								alt=""
								title={item.title}
								className="h-44 w-full max-w-[176px] rounded-xl object-cover ring-1 ring-black/10 transition-shadow hover:ring-2 hover:ring-primary/50"
							/>
						}
						onEdit={() => {
							setDetailOpen(false);
							setOpen(true);
						}}
						onDelete={() => {
							setDetailOpen(false);
							setConfirmOpen(true);
						}}
					/>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-primary"
								/>
							}
						>
							<Edit2 className="h-4 w-4" />
							<span className="sr-only">Editar</span>
						</DialogTrigger>
						<DialogContent className="bg-white sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>Editar Imagen</DialogTitle>
							</DialogHeader>
							<form action={formAction} className="space-y-4 text-left">
								<input type="hidden" name="id" value={item.id} />
								<GalleryFormFields item={item} categories={categories} />
								<label className="flex items-center gap-2 text-sm font-medium">
									<input
										type="checkbox"
										name="is_active"
										defaultChecked={item.is_active}
										className="size-4 accent-primary"
									/>
									Visible en la web pública
								</label>
								<FormError message={errorMessage} />
								<SubmitButton
									pendingLabel="Guardando…"
									className="w-full bg-secondary text-white"
								>
									Guardar cambios
								</SubmitButton>
							</form>
						</DialogContent>
					</Dialog>
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => setConfirmOpen(true)}
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">Eliminar</span>
					</Button>
					<ConfirmDialog
						open={confirmOpen}
						onOpenChange={setConfirmOpen}
						title="Eliminar imagen"
						description={`¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`}
						confirmLabel="Eliminar"
						onConfirm={() => handleDelete(item.id)}
						pending={isDeleting}
						destructive
					/>
				</div>
			</TableCell>
		</>
	);
}

/**
 * The item table's chrome. Extracted because the body is mounted two different
 * ways — sortable rows when the list is whole, plain rows when it is filtered —
 * and duplicating the header would let the two drift apart.
 */
function GalleryItemsTable({
	isEmpty,
	emptyMessage,
	children,
}: {
	isEmpty: boolean;
	emptyMessage: string;
	children: ReactNode;
}) {
	return (
		<Card className="border-border bg-white shadow-sm">
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10 text-xs font-mono text-muted-foreground">
								#
							</TableHead>
							<TableHead className="w-10" />
							<TableHead>Imagen</TableHead>
							<TableHead>Categoría</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead className="text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{children}
						{isEmpty ? (
							<TableRow>
								{/* +2 covers the drag-handle and # columns that precede COLUMN_COUNT data columns. */}
								<TableCell
									colSpan={COLUMN_COUNT + 2}
									className="py-8 text-center text-muted-foreground"
								>
									<ImageIcon
										className="mx-auto mb-2 h-6 w-6 text-[#c6ccd4]"
										aria-hidden
									/>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function CategoryFormFields({ category }: { category?: AdminGalleryCategory }) {
	return (
		<>
			<div className="space-y-2">
				<label className="text-sm font-medium">Nombre</label>
				<Input
					name="name"
					defaultValue={category?.name}
					placeholder="Ej. Terapias Ocupacionales"
					required
				/>
			</div>
			<div className="space-y-1">
				<label className="flex items-center gap-2 text-sm font-medium">
					<input
						type="checkbox"
						name="is_active"
						defaultChecked={category?.is_active ?? true}
						className="size-4 accent-primary"
					/>
					Categoría activa
				</label>
				<p className="text-xs text-muted-foreground">
					Las categorías inactivas no se muestran en la galería pública.
				</p>
			</div>
		</>
	);
}

/**
 * Asks what should happen to the photos bound to a category before it is
 * deleted or deactivated.
 *
 * Mounted only while a choice is pending, so the radio resets to `keep` every
 * time it opens: an inherited `purge` from a previous dialog would be a
 * destructive default.
 */
function CategoryCascadeDialog({
	kind,
	name,
	count,
	pending,
	onCancel,
	onConfirm,
}: {
	kind: CategoryCascadeKind;
	name: string;
	count: number;
	pending: boolean;
	onCancel: () => void;
	onConfirm: (mode: CategoryCascadeMode) => void;
}) {
	const [mode, setMode] = useState<CategoryCascadeMode>("keep");
	const radioName = useId();
	const copy = buildCategoryCascadeCopy(kind, name, count);
	const confirmColor = kind === "delete" ? "#c0392b" : "#c9821b";

	const options: { value: CategoryCascadeMode; label: string; hint: string }[] =
		[
			{ value: "keep", label: copy.keepLabel, hint: copy.keepHint },
			{ value: "purge", label: copy.purgeLabel, hint: copy.purgeHint },
		];

	return (
		<Dialog
			open
			onOpenChange={(next) => {
				if (!next) {
					onCancel();
				}
			}}
		>
			<DialogContent className="bg-white">
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{copy.body}</p>
				<div className="grid gap-2">
					{options.map((option) => (
						<label
							key={option.value}
							className="flex cursor-pointer gap-2.5 rounded-xl border border-border p-3 text-left transition-colors has-checked:border-ring has-checked:bg-muted/50"
						>
							<input
								type="radio"
								name={radioName}
								value={option.value}
								checked={mode === option.value}
								onChange={() => setMode(option.value)}
								className="mt-0.5 size-4 accent-primary"
							/>
							<span className="grid gap-1">
								<span className="text-sm font-medium">{option.label}</span>
								<span className="text-xs text-muted-foreground">
									{option.hint}
								</span>
							</span>
						</label>
					))}
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" disabled={pending} />}>
						Cancelar
					</DialogClose>
					<Button
						className="text-white hover:opacity-90"
						style={{ backgroundColor: confirmColor }}
						disabled={pending}
						onClick={() => onConfirm(mode)}
					>
						{copy.confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * One category chip plus everything it can open: the rename modal, the
 * keep/purge warning dialog, and the two void actions behind them.
 *
 * The dialog is skipped whenever the category holds no photos, for delete and
 * for deactivate alike — there is nothing to decide. Reactivation never asks:
 * it republishes exactly what a deactivation hid and nothing else.
 */
function CategoryChipItem({
	category,
	count,
	isSelected,
	onSelect,
}: {
	category: AdminGalleryCategory;
	count: number;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(updateGalleryCategory);
	const [cascadeKind, setCascadeKind] = useState<CategoryCascadeKind | null>(
		null,
	);
	const [isPending, startCascade] = useTransition();
	const router = useRouter();

	function submit(
		run: (formData: FormData) => Promise<void>,
		fields: Record<string, string>,
	) {
		const formData = new FormData();
		formData.set("id", category.id);

		for (const [key, value] of Object.entries(fields)) {
			formData.set(key, value);
		}

		startCascade(async () => {
			try {
				await run(formData);
				setCascadeKind(null);
			} catch {
				// The server rejected it (a concurrent rebind tripping RESTRICT, say).
				// Pull the authoritative state back rather than leaving the chip
				// showing an outcome that did not happen.
				router.refresh();
			}
		});
	}

	function handleToggle() {
		// Reactivation restores only what a deactivation hid, so there is nothing
		// to ask and no mode to send.
		if (!category.is_active) {
			submit(setGalleryCategoryActive, { is_active: "on" });
			return;
		}

		if (count === 0) {
			submit(setGalleryCategoryActive, { mode: "keep" });
			return;
		}

		setCascadeKind("deactivate");
	}

	function handleDelete() {
		if (count === 0) {
			submit(deleteGalleryCategory, { mode: "keep" });
			return;
		}

		setCascadeKind("delete");
	}

	function handleCascadeConfirm(mode: CategoryCascadeMode) {
		submit(
			cascadeKind === "delete"
				? deleteGalleryCategory
				: setGalleryCategoryActive,
			{ mode },
		);
	}

	return (
		<>
			<GalleryCategoryChip
				name={category.name}
				count={count}
				isActive={category.is_active}
				isSelected={isSelected}
				pending={isPending}
				onSelect={onSelect}
				onEdit={() => setOpen(true)}
				onToggle={handleToggle}
				onDelete={handleDelete}
			/>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle>Editar categoría</DialogTitle>
					</DialogHeader>
					<form action={formAction} className="space-y-4 text-left">
						<input type="hidden" name="id" value={category.id} />
						<CategoryFormFields category={category} />
						<FormError message={errorMessage} />
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>
								Cancelar
							</DialogClose>
							<SubmitButton
								pendingLabel="Guardando…"
								className="bg-secondary text-white"
							>
								Guardar
							</SubmitButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
			{cascadeKind ? (
				<CategoryCascadeDialog
					kind={cascadeKind}
					name={category.name}
					count={count}
					pending={isPending}
					onCancel={() => setCascadeKind(null)}
					onConfirm={handleCascadeConfirm}
				/>
			) : null}
		</>
	);
}

export function GalleryAdmin({
	items,
	categories,
}: {
	items: AdminGalleryItem[];
	categories: AdminGalleryCategory[];
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(createGalleryItem);
	const createCategory = useActionDialog(createGalleryCategory);
	const { handleReorder } = useReorder("gallery_items");
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	);

	// One snapshot feeds the chip counts, the table, and the dialog's {n}, so the
	// three cannot disagree.
	const counts = countItemsByCategory(items);
	const activeCategoryCount = categories.filter(
		(category) => category.is_active,
	).length;

	// A category deleted while it was the active filter leaves a dangling id.
	// Falling back to the whole list beats an empty table with no way to clear it.
	const selectedCategory =
		categories.find((category) => category.id === selectedCategoryId) ?? null;
	const visibleItems = filterByCategoryId(items, selectedCategory?.id ?? null);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-wide text-foreground">
						Galería
					</h1>
					<p className="text-muted-foreground">
						Gestioná las categorías y las imágenes visibles en la galería
						pública.
					</p>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={
							<Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90" />
						}
					>
						<Plus className="h-4 w-4" /> Nueva Imagen
					</DialogTrigger>
					<DialogContent className="bg-white sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Agregar Imagen</DialogTitle>
						</DialogHeader>
						<form action={formAction} className="space-y-4">
							<GalleryFormFields categories={categories} />
							<FormError message={errorMessage} />
							<SubmitButton
								pendingLabel="Guardando…"
								className="w-full bg-secondary text-white"
							>
								Guardar
							</SubmitButton>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="border-border bg-white shadow-sm">
				<CardContent className="space-y-4 p-5">
					<div className="flex items-center justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold tracking-wide text-foreground">
								Categorías
							</h2>
							<p className="text-sm text-muted-foreground">
								{categories.length} en total · {activeCategoryCount} activas
							</p>
						</div>

						<Dialog
							open={createCategory.open}
							onOpenChange={createCategory.setOpen}
						>
							<DialogTrigger
								render={
									<Button
										variant="secondary"
										className="flex items-center gap-2"
									/>
								}
							>
								<Plus className="h-4 w-4" /> Nueva categoría
							</DialogTrigger>
							<DialogContent className="bg-white">
								<DialogHeader>
									<DialogTitle>Nueva categoría</DialogTitle>
								</DialogHeader>
								<form
									action={createCategory.formAction}
									className="space-y-4 text-left"
								>
									<CategoryFormFields />
									<FormError message={createCategory.errorMessage} />
									<DialogFooter>
										<DialogClose render={<Button variant="outline" />}>
											Cancelar
										</DialogClose>
										<SubmitButton
											pendingLabel="Guardando…"
											className="bg-secondary text-white"
										>
											Guardar
										</SubmitButton>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						{categories.map((category) => (
							<CategoryChipItem
								key={category.id}
								category={category}
								count={counts.get(category.id) ?? 0}
								isSelected={selectedCategory?.id === category.id}
								onSelect={() =>
									setSelectedCategoryId(
										selectedCategory?.id === category.id ? null : category.id,
									)
								}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{selectedCategory ? (
				<div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm">
					<span className="text-muted-foreground">
						Filtrando por{" "}
						<strong className="text-foreground">{selectedCategory.name}</strong>
					</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelectedCategoryId(null)}
					>
						Limpiar filtro
					</Button>
				</div>
			) : null}

			{/*
			  Drag-to-reorder is available ONLY on the unfiltered list. `useReorder`
			  sends the rendered id array as the complete new order and the writer
			  rewrites those rows to a compact 0..n-1 range, so dragging inside a
			  filtered subset would renumber the visible rows into a short range
			  while every hidden row kept its old index — corrupting the order of
			  photos the administrator cannot even see.
			*/}
			{selectedCategory ? (
				<GalleryItemsTable
					isEmpty={visibleItems.length === 0}
					emptyMessage="No hay imágenes para este filtro."
				>
					{visibleItems.map((item, index) => (
						<TableRow key={item.id}>
							{/* No drag handle: see the note above. */}
							<GalleryRow
								item={item}
								handle={null}
								categories={categories}
								index={index}
							/>
						</TableRow>
					))}
				</GalleryItemsTable>
			) : (
				<SortableTable
					items={visibleItems}
					getId={(item) => item.id}
					onReorder={handleReorder}
					renderRow={(item, handle, index) => (
						<GalleryRow
							item={item}
							handle={handle}
							categories={categories}
							index={index}
						/>
					)}
				>
					<GalleryItemsTable
						isEmpty={visibleItems.length === 0}
						emptyMessage="No hay imágenes cargadas."
					>
						<SortableTableRows />
					</GalleryItemsTable>
				</SortableTable>
			)}
		</div>
	);
}

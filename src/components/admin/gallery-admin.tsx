"use client";

import { type ReactNode, useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";

import {
	createGalleryItem,
	deleteGalleryItem,
	updateGalleryItem,
	type AdminGalleryItem,
} from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	DetailDialog,
	type DetailField,
} from "@/components/admin/detail-dialog";
import { FormError } from "@/components/admin/form-error";
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
	DialogContent,
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

function GalleryFormFields({ item }: { item?: AdminGalleryItem }) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium">Título</label>
					<Input name="title" defaultValue={item?.title} required />
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Categoría</label>
					<Input name="category" defaultValue={item?.category} required />
				</div>
			</div>
			<ImageUploadField existingUrl={item?.image_url} required={!item} />
		</>
	);
}

function GalleryRow({
	item,
	handle,
}: {
	item: AdminGalleryItem;
	handle: ReactNode;
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(updateGalleryItem);
	const { confirmOpen, setConfirmOpen, isDeleting, handleDelete } =
		useDeleteAction(deleteGalleryItem);
	const [detailOpen, setDetailOpen] = useState(false);

	const detailFields: DetailField[] = [
		{ label: "Título", value: item.title },
		{ label: "Categoría", value: item.category },
		{
			label: "Imagen",
			value: <ImageLightbox src={item.image_url} alt="" title={item.title} />,
		},
		{ label: "Estado", value: <StatusBadge active={item.is_active} /> },
	];

	return (
		<>
			<TableCell className="w-10">{handle}</TableCell>
			<TableCell>
				<div className="flex items-center gap-3">
					<ImageLightbox src={item.image_url} alt="" title={item.title} />
					<span className="font-medium">{item.title}</span>
				</div>
			</TableCell>
			<TableCell>{item.category}</TableCell>
			<TableCell>
				<span
					className={
						item.is_active
							? "rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
							: "rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
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
								<GalleryFormFields item={item} />
								<label className="flex items-center gap-2 text-sm font-medium">
									<input
										type="checkbox"
										name="is_active"
										defaultChecked={item.is_active}
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

export function GalleryAdmin({ items }: { items: AdminGalleryItem[] }) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(createGalleryItem);
	const { handleReorder } = useReorder("gallery_items");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Galería
					</h1>
					<p className="text-muted-foreground">
						Gestioná las imágenes visibles en la galería pública.
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
							<GalleryFormFields />
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

			<SortableTable
				items={items}
				getId={(item) => item.id}
				onReorder={handleReorder}
				renderRow={(item, handle) => (
					<GalleryRow item={item} handle={handle} />
				)}
			>
				<Card className="border-border bg-white shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10" />
									<TableHead>Imagen</TableHead>
									<TableHead>Categoría</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<SortableTableRows />
								{items.length === 0 ? (
									<TableRow>
										{/* +1 covers the drag-handle column that precedes COLUMN_COUNT data columns. */}
										<TableCell
											colSpan={COLUMN_COUNT + 1}
											className="py-8 text-center text-muted-foreground"
										>
											No hay imágenes cargadas.
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</SortableTable>
		</div>
	);
}

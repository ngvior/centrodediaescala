"use client";

import { type ReactNode, useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";

import {
	createProfessional,
	deleteProfessional,
	updateProfessional,
	type AdminProfessional,
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
import { TruncatedText } from "@/components/admin/truncated-text";
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

const COLUMN_COUNT = 6;

function ProfessionalFormFields({ item }: { item?: AdminProfessional }) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium">Nombre</label>
					<Input name="first_name" defaultValue={item?.first_name} required />
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Apellido</label>
					<Input name="last_name" defaultValue={item?.last_name} required />
				</div>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">Rol / Especialidad</label>
				<Input name="role" defaultValue={item?.role} required />
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">Bio</label>
				<Input name="bio" defaultValue={item?.bio ?? ""} />
			</div>
			<ImageUploadField existingUrl={item?.image_url} />
		</>
	);
}

function ProfessionalRow({
	item,
	handle,
}: {
	item: AdminProfessional;
	handle: ReactNode;
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(updateProfessional);
	const { confirmOpen, setConfirmOpen, isDeleting, handleDelete } =
		useDeleteAction(deleteProfessional);
	const [detailOpen, setDetailOpen] = useState(false);

	const fullName = `${item.first_name} ${item.last_name}`;
	const detailFields: DetailField[] = [
		{ label: "Nombre", value: fullName },
		{ label: "Rol / Especialidad", value: item.role },
		{ label: "Bio", value: item.bio ?? "—" },
		{
			label: "Imagen",
			value: item.image_url ? (
				<ImageLightbox src={item.image_url} alt="" title={fullName} />
			) : (
				"—"
			),
		},
		{ label: "Estado", value: <StatusBadge active={item.is_active} /> },
	];

	return (
		<>
			<TableCell className="w-10">{handle}</TableCell>
			<TableCell>
				{item.image_url ? (
					<ImageLightbox src={item.image_url} alt="" title={fullName} />
				) : null}
			</TableCell>
			<TableCell className="font-medium">
				{item.first_name} {item.last_name}
			</TableCell>
			<TableCell>
				<TruncatedText value={item.role} />
			</TableCell>
			<TableCell>
				<TruncatedText value={item.bio} />
			</TableCell>
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
						title={fullName}
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
								<DialogTitle>Editar Profesional</DialogTitle>
							</DialogHeader>
							<form action={formAction} className="space-y-4 text-left">
								<input type="hidden" name="id" value={item.id} />
								<ProfessionalFormFields item={item} />
								<label className="flex items-center gap-2 text-sm font-medium">
									<input
										type="checkbox"
										name="is_active"
										defaultChecked={item.is_active}
									/>
									Activo en la web pública
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
						title="Eliminar profesional"
						description={`¿Eliminar a ${item.first_name} ${item.last_name}? Esta acción no se puede deshacer.`}
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

export function ProfessionalsAdmin({ items }: { items: AdminProfessional[] }) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(createProfessional);
	const { handleReorder } = useReorder("professionals");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Profesionales
					</h1>
					<p className="text-muted-foreground">
						Gestioná el equipo interdisciplinario que aparece en la web.
					</p>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={
							<Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90" />
						}
					>
						<Plus className="h-4 w-4" /> Nuevo Profesional
					</DialogTrigger>
					<DialogContent className="bg-white sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Agregar Profesional</DialogTitle>
						</DialogHeader>
						<form action={formAction} className="space-y-4">
							<ProfessionalFormFields />
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
					<ProfessionalRow item={item} handle={handle} />
				)}
			>
				<Card className="border-border bg-white shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10" />
									<TableHead>Imagen</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Rol / Especialidad</TableHead>
									<TableHead>Bio</TableHead>
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
											No hay profesionales cargados.
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

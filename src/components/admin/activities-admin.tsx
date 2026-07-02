"use client";

import { type ReactNode, useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";

import {
	createActivity,
	deleteActivity,
	updateActivity,
	type AdminActivity,
} from "@/actions/admin";
import {
	ActivityIconField,
	ActivityIconPreview,
} from "@/components/admin/activity-icon-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	DetailDialog,
	type DetailField,
} from "@/components/admin/detail-dialog";
import { FormError } from "@/components/admin/form-error";
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
import { Textarea } from "@/components/ui/textarea";

const COLUMN_COUNT = 5;

function ActivityFormFields({ item }: { item?: AdminActivity }) {
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
			<ActivityIconField defaultValue={item?.icon} />
			<div className="space-y-2">
				<label className="text-sm font-medium">Descripción</label>
				<Textarea
					name="description"
					defaultValue={item?.description}
					rows={4}
					required
				/>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">
					Horario / información adicional
				</label>
				<Input name="schedule_info" defaultValue={item?.schedule_info ?? ""} />
			</div>
		</>
	);
}

function ActivityRow({
	item,
	handle,
}: {
	item: AdminActivity;
	handle: ReactNode;
}) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(updateActivity);
	const { confirmOpen, setConfirmOpen, isDeleting, handleDelete } =
		useDeleteAction(deleteActivity);
	const [detailOpen, setDetailOpen] = useState(false);

	const detailFields: DetailField[] = [
		{ label: "Título", value: item.title },
		{ label: "Categoría", value: item.category },
		{ label: "Ícono", value: <ActivityIconPreview slug={item.icon} /> },
		{ label: "Descripción", value: item.description },
		{ label: "Horario", value: item.schedule_info ?? "—" },
		{ label: "Estado", value: <StatusBadge active={item.is_active} /> },
	];

	return (
		<>
			<TableCell className="w-10">{handle}</TableCell>
			<TableCell>
				<div className="font-medium">{item.title}</div>
				<div className="max-w-xl truncate text-sm text-muted-foreground">
					{item.description}
				</div>
			</TableCell>
			<TableCell>{item.category}</TableCell>
			<TableCell>
				<ActivityIconPreview slug={item.icon} />
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
								<DialogTitle>Editar Actividad</DialogTitle>
							</DialogHeader>
							<form action={formAction} className="space-y-4 text-left">
								<input type="hidden" name="id" value={item.id} />
								<ActivityFormFields item={item} />
								<label className="flex items-center gap-2 text-sm font-medium">
									<input
										type="checkbox"
										name="is_active"
										defaultChecked={item.is_active}
									/>
									Activa en la web pública
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
						title="Eliminar actividad"
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

export function ActivitiesAdmin({ items }: { items: AdminActivity[] }) {
	const { formAction, open, setOpen, errorMessage } =
		useActionDialog(createActivity);
	const { handleReorder } = useReorder("activities");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-wide text-foreground">
						Actividades
					</h1>
					<p className="text-muted-foreground">
						Gestioná talleres y actividades de la web pública.
					</p>
				</div>

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={
							<Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90" />
						}
					>
						<Plus className="h-4 w-4" /> Nueva Actividad
					</DialogTrigger>
					<DialogContent className="bg-white sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Agregar Actividad</DialogTitle>
						</DialogHeader>
						<form action={formAction} className="space-y-4">
							<ActivityFormFields />
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
					<ActivityRow item={item} handle={handle} />
				)}
			>
				<Card className="border-border bg-white shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10" />
									<TableHead>Actividad</TableHead>
									<TableHead>Categoría</TableHead>
									<TableHead>Ícono</TableHead>
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
											No hay actividades cargadas.
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

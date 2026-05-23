import {
	createHomeObjective,
	deleteHomeObjective,
	getAdminObjectives,
	updateHomeObjective,
} from "@/actions/admin";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Edit2, Plus, Trash2 } from "lucide-react";

type ObjectiveFieldsDefaults = {
	title: string;
	description: string;
	icon: string | null;
	order_index: number;
};

function ObjectiveFields({ defaults }: { defaults?: ObjectiveFieldsDefaults }) {
	return (
		<>
			<div className="space-y-2">
				<label className="text-sm font-medium">Título</label>
				<Input name="title" defaultValue={defaults?.title} required />
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">Descripción</label>
				<Textarea
					name="description"
					defaultValue={defaults?.description}
					rows={4}
					required
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-[1fr_120px]">
				<div className="space-y-2">
					<label className="text-sm font-medium">Icono (clase CSS)</label>
					<Input
						name="icon"
						defaultValue={defaults?.icon ?? "fa-check"}
						placeholder="fa-check"
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Orden</label>
					<Input
						name="order_index"
						type="number"
						defaultValue={defaults?.order_index ?? 0}
					/>
				</div>
			</div>
		</>
	);
}

export default async function ObjetivosPage() {
	const objectives = await getAdminObjectives();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Objetivos
					</h1>
					<p className="text-muted-foreground">
						Gestioná los objetivos institucionales que se muestran en el Inicio.
					</p>
				</div>

				<Dialog>
					<DialogTrigger
						render={
							<Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90" />
						}
					>
						<Plus className="h-4 w-4" /> Nuevo Objetivo
					</DialogTrigger>
					<DialogContent className="bg-white sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Agregar Objetivo</DialogTitle>
						</DialogHeader>
						<form action={createHomeObjective} className="space-y-4">
							<ObjectiveFields />
							<Button type="submit" className="w-full bg-secondary text-white">
								Guardar
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="border-border bg-white shadow-sm">
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Objetivo</TableHead>
								<TableHead>Icono</TableHead>
								<TableHead>Orden</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{objectives.map((obj) => (
								<TableRow key={obj.id}>
									<TableCell>
										<div className="font-medium">{obj.title}</div>
										<div className="max-w-xl truncate text-sm text-muted-foreground">
											{obj.description}
										</div>
									</TableCell>
									<TableCell>{obj.icon ?? "fa-check"}</TableCell>
									<TableCell>{obj.order_index}</TableCell>
									<TableCell>
										<span
											className={
												obj.is_active
													? "rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
													: "rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
											}
										>
											{obj.is_active ? "Activo" : "Inactivo"}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Dialog>
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
														<DialogTitle>Editar Objetivo</DialogTitle>
													</DialogHeader>
													<form
														action={updateHomeObjective}
														className="space-y-4 text-left"
													>
														<input type="hidden" name="id" value={obj.id} />
														<ObjectiveFields defaults={obj} />
														<label className="flex items-center gap-2 text-sm font-medium">
															<input
																type="checkbox"
																name="is_active"
																defaultChecked={obj.is_active}
															/>
															Visible en la web pública
														</label>
														<Button
															type="submit"
															className="w-full bg-secondary text-white"
														>
															Guardar cambios
														</Button>
													</form>
												</DialogContent>
											</Dialog>
											<form action={deleteHomeObjective}>
												<input type="hidden" name="id" value={obj.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													className="text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Eliminar</span>
												</Button>
											</form>
										</div>
									</TableCell>
								</TableRow>
							))}
							{objectives.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="py-8 text-center text-muted-foreground"
									>
										No hay objetivos cargados.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

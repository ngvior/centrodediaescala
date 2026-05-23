import {
	createProfessional,
	deleteProfessional,
	getAdminProfessionals,
	updateProfessional,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Edit2, Plus, Trash2 } from "lucide-react";

function ProfessionalFields({
	defaults,
}: {
	defaults?: {
		first_name: string;
		last_name: string;
		role: string;
		bio: string | null;
		image_url: string | null;
		order_index: number;
	};
}) {
	return (
		<>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label className="text-sm font-medium">Nombre</label>
					<Input
						name="first_name"
						defaultValue={defaults?.first_name}
						required
					/>
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Apellido</label>
					<Input name="last_name" defaultValue={defaults?.last_name} required />
				</div>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">Rol / Especialidad</label>
				<Input name="role" defaultValue={defaults?.role} required />
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium">Bio</label>
				<Input name="bio" defaultValue={defaults?.bio ?? ""} />
			</div>
			<div className="grid gap-4 md:grid-cols-[1fr_120px]">
				<div className="space-y-2">
					<label className="text-sm font-medium">Imagen</label>
					<Input name="image_file" type="file" accept="image/*" />
					<input
						type="hidden"
						name="existing_image_url"
						value={defaults?.image_url ?? ""}
					/>
					{defaults?.image_url && (
						<p className="text-xs text-muted-foreground truncate">
							Actual: {defaults.image_url}
						</p>
					)}
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

export default async function ProfesionalesPage() {
	const professionals = await getAdminProfessionals();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Profesionales
					</h1>
					<p className="text-muted-foreground">
						Gestioná el equipo interdisciplinario que aparece en la web.
					</p>
				</div>

				<Dialog>
					<DialogTrigger
						render={
							<Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2" />
						}
					>
						<Plus className="h-4 w-4" /> Nuevo Profesional
					</DialogTrigger>
					<DialogContent className="bg-white sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Agregar Profesional</DialogTitle>
						</DialogHeader>
						<form
							action={createProfessional}
							encType="multipart/form-data"
							className="space-y-4"
						>
							<ProfessionalFields />
							<Button type="submit" className="w-full bg-secondary text-white">
								Guardar
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="border-border shadow-sm bg-white">
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nombre</TableHead>
								<TableHead>Rol / Especialidad</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{professionals.map((prof) => (
								<TableRow key={prof.id}>
									<TableCell className="font-medium">
										{prof.first_name} {prof.last_name}
									</TableCell>
									<TableCell>{prof.role}</TableCell>
									<TableCell>
										<span
											className={
												prof.is_active
													? "bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-medium"
													: "bg-muted text-muted-foreground text-xs px-2 py-1 rounded font-medium"
											}
										>
											{prof.is_active ? "Activo" : "Inactivo"}
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
														<DialogTitle>Editar Profesional</DialogTitle>
													</DialogHeader>
													<form
														action={updateProfessional}
														encType="multipart/form-data"
														className="space-y-4 text-left"
													>
														<input type="hidden" name="id" value={prof.id} />
														<ProfessionalFields defaults={prof} />
														<label className="flex items-center gap-2 text-sm font-medium">
															<input
																type="checkbox"
																name="is_active"
																defaultChecked={prof.is_active}
															/>
															Activo en la web pública
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
											<form action={deleteProfessional}>
												<input type="hidden" name="id" value={prof.id} />
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
							{professionals.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
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
		</div>
	);
}

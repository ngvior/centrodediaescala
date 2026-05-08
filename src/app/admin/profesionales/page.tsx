import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getProfessionals } from "@/lib/api";

export default async function ProfesionalesPage() {
  const professionals = await getProfessionals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profesionales</h1>
          <p className="text-muted-foreground">Gestioná el equipo interdisciplinario que aparece en la web.</p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Profesional
        </Button>
      </div>

      <Card className="border-border shadow-sm">
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
              {professionals.map((prof: any) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.first_name} {prof.last_name}</TableCell>
                  <TableCell>{prof.role}</TableCell>
                  <TableCell>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-medium">Activo</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

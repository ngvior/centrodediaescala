import {
  createActivity,
  deleteActivity,
  getAdminActivities,
  updateActivity,
} from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Plus, Trash2 } from 'lucide-react'

type ActivityFieldsDefaults = {
  title: string
  description: string
  category: string
  image_url: string | null
  schedule_info: string | null
  order_index: number
}

function ActivityFields({ defaults }: { defaults?: ActivityFieldsDefaults }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input name="title" defaultValue={defaults?.title} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría</label>
          <Input name="category" defaultValue={defaults?.category} required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea name="description" defaultValue={defaults?.description} rows={4} required />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <label className="text-sm font-medium">Imagen</label>
          <Input name="image_url" defaultValue={defaults?.image_url ?? ''} placeholder="/actividad.jpg" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Orden</label>
          <Input name="order_index" type="number" defaultValue={defaults?.order_index ?? 0} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Horario / información adicional</label>
        <Input name="schedule_info" defaultValue={defaults?.schedule_info ?? ''} />
      </div>
    </>
  )
}

export default async function ActividadesPage() {
  const activities = await getAdminActivities()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Actividades</h1>
          <p className="text-muted-foreground">Gestioná talleres y actividades de la web pública.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90" />}>
            <Plus className="h-4 w-4" /> Nueva Actividad
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Actividad</DialogTitle>
            </DialogHeader>
            <form action={createActivity} className="space-y-4">
              <ActivityFields />
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
                <TableHead>Actividad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="font-medium">{activity.title}</div>
                    <div className="max-w-xl truncate text-sm text-muted-foreground">
                      {activity.description}
                    </div>
                  </TableCell>
                  <TableCell>{activity.category}</TableCell>
                  <TableCell>{activity.order_index}</TableCell>
                  <TableCell>
                    <span className={activity.is_active ? 'rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800' : 'rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'}>
                      {activity.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" />}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </DialogTrigger>
                        <DialogContent className="bg-white sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Actividad</DialogTitle>
                          </DialogHeader>
                          <form action={updateActivity} className="space-y-4 text-left">
                            <input type="hidden" name="id" value={activity.id} />
                            <ActivityFields defaults={activity} />
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input type="checkbox" name="is_active" defaultChecked={activity.is_active} />
                              Activa en la web pública
                            </label>
                            <Button type="submit" className="w-full bg-secondary text-white">
                              Guardar cambios
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <form action={deleteActivity}>
                        <input type="hidden" name="id" value={activity.id} />
                        <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay actividades cargadas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import {
  getAdminInterviewRequests,
  updateInterviewRequestCrm,
  type AdminInterviewRequest,
  type InterviewRequestStatus,
} from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const STATUS_OPTIONS: { value: InterviewRequestStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONTACTED', label: 'Contactado' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

const STATUS_LABELS: Record<InterviewRequestStatus, string> = {
  PENDING: 'Pendiente',
  CONTACTED: 'Contactado',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
}

const STATUS_BADGE_CLASSES: Record<InterviewRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-sky-100 text-sky-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
}

type InterviewsPageProps = {
  searchParams?: Promise<{ status?: string | string[] }>
}

function getStatusLabel(status: InterviewRequestStatus) {
  return STATUS_LABELS[status]
}

function normalizeStatusFilter(status: string | string[] | undefined) {
  const value = Array.isArray(status) ? status[0] : status

  return STATUS_OPTIONS.some((option) => option.value === value)
    ? (value as InterviewRequestStatus)
    : undefined
}

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function InterviewRequestCard({ request }: { request: AdminInterviewRequest }) {
  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl uppercase tracking-wide">{request.contact_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {request.patient_name ? `Paciente: ${request.patient_name}` : 'Sin paciente indicado'}
          </p>
          <p className="text-sm text-muted-foreground">
            Recibida el {formatRequestDate(request.created_at)}
          </p>
        </div>
        <span className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[request.status]}`}>
          {getStatusLabel(request.status)}
        </span>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Teléfono</p>
              <a className="text-primary hover:underline" href={`tel:${request.phone}`}>
                {request.phone}
              </a>
            </div>
            <div>
              <p className="font-medium text-foreground">Email</p>
              {request.email ? (
                <a className="text-primary hover:underline" href={`mailto:${request.email}`}>
                  {request.email}
                </a>
              ) : (
                <p className="text-muted-foreground">No informado</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground">Mensaje original</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {request.message || 'Sin mensaje adicional.'}
            </p>
          </div>
        </div>

        <form action={updateInterviewRequestCrm} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <input type="hidden" name="id" value={request.id} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`status-${request.id}`}>
              Estado CRM
            </label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={request.status}
              id={`status-${request.id}`}
              name="status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`notes-${request.id}`}>
              Notas internas
            </label>
            <Textarea
              defaultValue={request.notes ?? ''}
              id={`notes-${request.id}`}
              maxLength={2000}
              name="notes"
              placeholder="Agregá seguimiento interno, llamadas realizadas o próximos pasos."
              rows={6}
            />
          </div>
          <Button type="submit" className="w-full bg-secondary text-white">
            Guardar CRM
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default async function EntrevistasPage({ searchParams }: InterviewsPageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedStatus = normalizeStatusFilter(params.status)
  const requests = await getAdminInterviewRequests(selectedStatus)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-foreground">Entrevistas</h1>
          <p className="text-muted-foreground">
            Revisá solicitudes, actualizá el estado y dejá notas internas sin modificar los datos originales.
          </p>
        </div>

        <form className="flex items-end gap-3" action="/admin/entrevistas">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="status-filter">
              Filtrar por estado
            </label>
            <select
              className="h-10 min-w-48 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={selectedStatus ?? 'ALL'}
              id="status-filter"
              name="status"
            >
              <option value="ALL">Todos</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <InterviewRequestCard key={request.id} request={request} />
          ))
        ) : (
          <Card className="border-border bg-white shadow-sm">
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay solicitudes de entrevista para mostrar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { getAdminDashboardData } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Inbox, Users } from "lucide-react";

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "PENDIENTE",
    CONTACTED: "CONTACTADO",
    CONFIRMED: "CONFIRMADO",
    REJECTED: "RECHAZADO",
  };

  return labels[status] ?? status;
}

export default async function DashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground">Bienvenido al backoffice del Centro de Día Escala.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Pendientes</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {dashboard.pendingInterviewRequests}
            </div>
            <p className="text-xs text-muted-foreground">Solicitudes por revisar</p>
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeProfessionals}</div>
            <p className="text-xs text-muted-foreground">En el equipo activo</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeActivities}</div>
            <p className="text-xs text-muted-foreground">Talleres configurados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Últimas Solicitudes de Entrevista</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.latestInterviewRequests.length > 0 ? (
              <div className="space-y-4">
                {dashboard.latestInterviewRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">
                        {request.contact_name}
                        {request.patient_name ? ` (para ${request.patient_name})` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRequestDate(request.created_at)} • {request.phone}
                      </p>
                    </div>
                    <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-medium">
                      {getStatusLabel(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay solicitudes cargadas todavía.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

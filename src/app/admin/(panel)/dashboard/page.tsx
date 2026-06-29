import {
  getAdminDashboardData,
  type EntityCounts,
  type InterviewRequestStatus,
} from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Calendar,
  CalendarClock,
  ClipboardList,
  Image as ImageIcon,
  Inbox,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const STATUS_META: Record<
  InterviewRequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: { label: "Pendientes", badgeClass: "bg-amber-100 text-amber-800" },
  CONTACTED: { label: "Contactadas", badgeClass: "bg-sky-100 text-sky-800" },
  CONFIRMED: {
    label: "Confirmadas",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  REJECTED: { label: "Rechazadas", badgeClass: "bg-rose-100 text-rose-800" },
};

const STATUS_ORDER: InterviewRequestStatus[] = [
  "PENDING",
  "CONTACTED",
  "CONFIRMED",
  "REJECTED",
];

function getRequestStatusLabel(status: string) {
  return STATUS_META[status as InterviewRequestStatus]?.label ?? status;
}

type EntityStatCardProps = {
  title: string;
  icon: LucideIcon;
  counts: EntityCounts;
  href: string;
  hiddenSingular: string;
  hiddenPlural: string;
};

function EntityStatCard({
  title,
  icon: Icon,
  counts,
  href,
  hiddenSingular,
  hiddenPlural,
}: EntityStatCardProps) {
  const hidden = Math.max(counts.total - counts.active, 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {counts.active}
          <span className="text-base font-medium text-muted-foreground">
            {" "}
            / {counts.total}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {hidden > 0
            ? `${hidden} ${hidden === 1 ? hiddenSingular : hiddenPlural}`
            : "Todas visibles"}
        </p>
        <Link className="text-xs text-primary hover:underline" href={href}>
          Gestionar
        </Link>
      </CardContent>
    </Card>
  );
}

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/profesionales", label: "Profesionales", icon: Users },
  { href: "/admin/actividades", label: "Actividades", icon: Calendar },
  { href: "/admin/galeria", label: "Galería", icon: ImageIcon },
  { href: "/admin/objetivos", label: "Objetivos", icon: Target },
  { href: "/admin/entrevistas", label: "Entrevistas", icon: Inbox },
];

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
            <CardTitle className="text-sm font-medium">Entrevistas Pendientes</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {dashboard.pendingInterviewRequests}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.totalInterviewRequests} solicitudes en total
            </p>
            <Link className="text-xs text-primary hover:underline" href="/admin/entrevistas?status=PENDING">
              Ver solicitudes por revisar
            </Link>
          </CardContent>
        </Card>

        <EntityStatCard
          title="Profesionales"
          icon={Users}
          counts={dashboard.professionals}
          href="/admin/profesionales"
          hiddenSingular="oculto"
          hiddenPlural="ocultos"
        />

        <EntityStatCard
          title="Actividades"
          icon={Calendar}
          counts={dashboard.activities}
          href="/admin/actividades"
          hiddenSingular="oculta"
          hiddenPlural="ocultas"
        />

        <EntityStatCard
          title="Galería"
          icon={ImageIcon}
          counts={dashboard.galleryItems}
          href="/admin/galeria"
          hiddenSingular="oculta"
          hiddenPlural="ocultas"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Solicitudes de Entrevista</CardTitle>
            <Link className="text-sm font-medium text-primary hover:underline" href="/admin/entrevistas">
              Abrir CRM
            </Link>
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
                    <div
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        STATUS_META[request.status]?.badgeClass ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getRequestStatusLabel(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay solicitudes cargadas todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado de entrevistas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <span
                    className={`w-fit rounded px-2 py-1 text-xs font-medium ${STATUS_META[status].badgeClass}`}
                  >
                    {STATUS_META[status].label}
                  </span>
                  <span className="text-sm font-semibold">
                    {dashboard.interviewStatusBreakdown[status]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>
                <span className="font-semibold text-foreground">
                  {dashboard.interviewRequestsThisWeek}
                </span>{" "}
                esta semana
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

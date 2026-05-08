import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold">ESCALA</h2>
          <p className="text-primary-foreground/80 text-sm">Backoffice</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/admin/profesionales" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <Users className="h-5 w-5" />
            Profesionales
          </Link>
          <Link href="/admin/actividades" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <Calendar className="h-5 w-5" />
            Actividades
          </Link>
          <Link href="/admin/configuracion" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="h-5 w-5" />
            Configuración
          </Link>
        </nav>
        <div className="p-4 border-t border-white/20">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-white/10 transition-colors text-left">
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">ESCALA Admin</h2>
          <button><LayoutDashboard className="h-6 w-6" /></button>
        </header>
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

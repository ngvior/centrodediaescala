import { ReactNode } from "react";
import Link from "next/link";
import {
	LayoutDashboard,
	Users,
	Calendar,
	Settings,
	LogOut,
	ImageIcon,
	MessageSquare,
	CheckSquare,
} from "lucide-react";
import { logoutAdmin } from "@/actions/auth";
import { AdminNavLinkStatus } from "@/components/admin/admin-nav-link-status";

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen bg-muted/30 font-sans">
			{/* Sidebar */}
			<aside className="w-64 bg-[#222222] text-white hidden md:flex flex-col">
				<div className="p-6 border-b border-white/10">
					<h2 className="text-2xl font-bold text-primary">ESCALA</h2>
					<p className="text-white/60 text-sm">Backoffice</p>
				</div>
				<nav className="flex-1 p-4 space-y-2">
					<Link
						href="/admin/dashboard"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<LayoutDashboard className="h-5 w-5 text-secondary" />
						Dashboard
						<AdminNavLinkStatus href="/admin/dashboard" />
					</Link>
					<Link
						href="/admin/profesionales"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<Users className="h-5 w-5 text-secondary" />
						Profesionales
						<AdminNavLinkStatus href="/admin/profesionales" />
					</Link>
					<Link
						href="/admin/actividades"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<Calendar className="h-5 w-5 text-secondary" />
						Actividades
						<AdminNavLinkStatus href="/admin/actividades" />
					</Link>
					<Link
						href="/admin/galeria"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<ImageIcon className="h-5 w-5 text-secondary" />
						Galería
						<AdminNavLinkStatus href="/admin/galeria" />
					</Link>
					<Link
						href="/admin/objetivos"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<CheckSquare className="h-5 w-5 text-secondary" />
						Objetivos
						<AdminNavLinkStatus href="/admin/objetivos" />
					</Link>
					<Link
						href="/admin/entrevistas"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<MessageSquare className="h-5 w-5 text-secondary" />
						Entrevistas
						<AdminNavLinkStatus href="/admin/entrevistas" />
					</Link>
					<Link
						href="/admin/configuracion"
						className="relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
					>
						<Settings className="h-5 w-5 text-secondary" />
						Configuración
						<AdminNavLinkStatus href="/admin/configuracion" />
					</Link>
				</nav>
				<div className="p-4 border-t border-white/10">
					<form action={logoutAdmin}>
						<button
							type="submit"
							className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/20 text-red-400 transition-colors text-left"
						>
							<LogOut className="h-5 w-5" />
							Cerrar Sesión
						</button>
					</form>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-h-screen">
				{/* Mobile Header */}
				<header className="md:hidden bg-[#222222] text-white p-4 flex justify-between items-center">
					<h2 className="text-xl font-bold text-primary">ESCALA Admin</h2>
					<form action={logoutAdmin}>
						<button type="submit">
							<LogOut className="h-6 w-6 text-red-400" />
						</button>
					</form>
				</header>
				<div className="flex-1 p-6 md:p-8">{children}</div>
			</main>
		</div>
	);
}

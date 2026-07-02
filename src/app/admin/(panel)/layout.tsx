import { ReactNode } from "react";
import Image from "next/image";
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
		<div className="flex min-h-screen bg-admin-canvas font-sans [--muted-foreground:#626973] [--radius:10px]">
			{/* Sidebar */}
			<aside className="w-64 bg-[#222222] text-white hidden md:flex flex-col">
				<div className="relative p-6">
					<div className="flex items-center justify-center rounded-[10px] bg-white px-3 py-2.5">
						<Image
							src="/logo.png"
							alt="Centro de Día Escala"
							width={250}
							height={100}
							className="h-auto w-full max-w-[165px]"
						/>
					</div>
					<p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
						Backoffice
					</p>
					<div
						aria-hidden
						className="absolute inset-x-0 bottom-0 h-0.5 bg-escala-spectrum"
					/>
				</div>
				<nav className="flex-1 p-3 space-y-1">
					<Link
						href="/admin/dashboard"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<LayoutDashboard className="h-5 w-5 text-secondary" />
						Dashboard
						<AdminNavLinkStatus href="/admin/dashboard" />
					</Link>
					<Link
						href="/admin/profesionales"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<Users className="h-5 w-5 text-secondary" />
						Profesionales
						<AdminNavLinkStatus href="/admin/profesionales" />
					</Link>
					<Link
						href="/admin/actividades"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<Calendar className="h-5 w-5 text-secondary" />
						Actividades
						<AdminNavLinkStatus href="/admin/actividades" />
					</Link>
					<Link
						href="/admin/galeria"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<ImageIcon className="h-5 w-5 text-secondary" />
						Galería
						<AdminNavLinkStatus href="/admin/galeria" />
					</Link>
					<Link
						href="/admin/objetivos"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<CheckSquare className="h-5 w-5 text-secondary" />
						Objetivos
						<AdminNavLinkStatus href="/admin/objetivos" />
					</Link>
					<Link
						href="/admin/entrevistas"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
					>
						<MessageSquare className="h-5 w-5 text-secondary" />
						Entrevistas
						<AdminNavLinkStatus href="/admin/entrevistas" />
					</Link>
					<Link
						href="/admin/configuracion"
						className="relative isolate flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
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
					<div className="rounded-lg bg-white px-2.5 py-1.5">
						<Image
							src="/logo.png"
							alt="Centro de Día Escala"
							width={250}
							height={100}
							className="h-7 w-auto"
						/>
					</div>
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

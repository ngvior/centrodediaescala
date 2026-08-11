import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Administración - Centro de Día Escala",
		template: "%s | Administración - Centro de Día Escala",
	},
	description: "Panel de administración de Centro de Día Escala",
};

export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

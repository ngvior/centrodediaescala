"use client";

import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Per-link active + pending indicator for the admin sidebar. Must render as a
 * descendant of the owning <Link> so useLinkStatus can read its pending state.
 * usePathname drives the active accent bar; useLinkStatus drives the spinner.
 */
export function AdminNavLinkStatus({ href }: { href: string }) {
	const pathname = usePathname();
	const { pending } = useLinkStatus();
	const active = pathname === href || pathname.startsWith(`${href}/`);

	return (
		<>
			{active ? (
				<span
					aria-hidden
					className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary"
				/>
			) : null}
			{pending ? (
				<Loader2
					aria-hidden
					className="ml-auto h-4 w-4 animate-spin text-secondary"
				/>
			) : null}
		</>
	);
}

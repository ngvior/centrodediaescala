/**
 * Active/inactive pill used in the admin detail dialogs. Mirrors the inline
 * badge already rendered in the island table rows; extracted here because the
 * detail views add a 4th+ occurrence.
 */
export function StatusBadge({ active }: { active: boolean }) {
	return (
		<span
			className={
				active
					? "rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
					: "rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
			}
		>
			{active ? "Activo" : "Inactivo"}
		</span>
	);
}

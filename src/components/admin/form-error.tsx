/**
 * Inline form-level error banner shared by every admin island. Renders nothing
 * when there is no message, so callers can pass the action's error message
 * directly without guarding.
 */
export function FormError({ message }: { message: string | null }) {
	if (!message) {
		return null;
	}

	return (
		<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{message}
		</div>
	);
}

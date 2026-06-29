import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shared Suspense fallback for every admin panel segment. Rendered instantly on
 * section navigation while the dynamic (cookie-gated) route streams in.
 */
export default function AdminPanelLoading() {
	return (
		<div className="space-y-6" aria-busy="true" aria-live="polite">
			<span className="sr-only">Cargando…</span>
			<div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
			<Card>
				<CardHeader>
					<div className="h-5 w-40 animate-pulse rounded bg-muted" />
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 5 }).map((_, index) => (
						<div
							key={index}
							className="h-10 w-full animate-pulse rounded bg-muted"
						/>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

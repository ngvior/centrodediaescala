"use client";

import { useActionState, useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Trash2 } from "lucide-react";

import {
	deleteInterviewRequest,
	updateInterviewRequestCrm,
	type ActionResult,
	type AdminInterviewRequest,
	type InterviewRequestStatus,
} from "@/actions/admin";
import { FormError } from "@/components/admin/form-error";
import { useDeleteAction } from "@/components/admin/use-delete-action";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Interview request enriched server-side with a pre-formatted date label. */
export type InterviewCardData = AdminInterviewRequest & { dateLabel: string };

type StatusFilter = InterviewRequestStatus | "ALL";

type StatusMeta = {
	label: string;
	/** Soft background shared by header bands, avatars and selected states. */
	tint: string;
	text: string;
	border: string;
	dot: string;
	/**
	 * Complete literal class string for the card footer button: Tailwind's JIT
	 * cannot see interpolated class names, and the hover shade cannot be
	 * expressed as an inline style.
	 */
	updateButtonClassName: string;
};

// Exact palette from the CRM design doc (screen 2a / card variant 1b). The
// neutral grays/blues and the unicode glyphs across this file are also the
// design doc's own values, kept literal on purpose instead of admin theme
// tokens (whose grays differ, e.g. --muted-foreground #626973) so this screen
// stays pixel-faithful to the mock.
const STATUS_META: Record<InterviewRequestStatus, StatusMeta> = {
	PENDING: {
		label: "Pendiente",
		tint: "#fef6e0",
		text: "#92600a",
		border: "#fcd34d",
		dot: "#f59e0b",
		updateButtonClassName:
			"border-[#fcd34d] bg-[#fef6e0] text-[#92600a] hover:bg-[#fdf2ce]",
	},
	CONTACTED: {
		label: "Contactado",
		tint: "#e6effe",
		text: "#1e429f",
		border: "#93c5fd",
		dot: "#3b82f6",
		updateButtonClassName:
			"border-[#93c5fd] bg-[#e6effe] text-[#1e429f] hover:bg-[#dceafe]",
	},
	CONFIRMED: {
		label: "Confirmado",
		tint: "#e4f8ea",
		text: "#166534",
		border: "#86efac",
		dot: "#22c55e",
		updateButtonClassName:
			"border-[#86efac] bg-[#e4f8ea] text-[#166534] hover:bg-[#d9f7e3]",
	},
	REJECTED: {
		label: "Rechazado",
		tint: "#fdeaea",
		text: "#991b1b",
		border: "#fca5a5",
		dot: "#ef4444",
		updateButtonClassName:
			"border-[#fca5a5] bg-[#fdeaea] text-[#991b1b] hover:bg-[#fbdcdc]",
	},
};

const STATUS_ORDER: InterviewRequestStatus[] = [
	"PENDING",
	"CONTACTED",
	"CONFIRMED",
	"REJECTED",
];

const FILTER_CHIPS: { value: StatusFilter; label: string }[] = [
	{ value: "ALL", label: "Todos" },
	{ value: "PENDING", label: "Pendientes" },
	{ value: "CONTACTED", label: "Contactados" },
	{ value: "CONFIRMED", label: "Confirmados" },
	{ value: "REJECTED", label: "Rechazados" },
];

const ALL_FILTER_DOT_COLOR = "#64748b";

const IDLE_STATE: ActionResult = { status: "idle" };

const TOAST_DISMISS_MS = 2600;

/** First two letters of the first word of the contact name, uppercased. */
export function getInitials(name: string) {
	const [firstWord = ""] = name.trim().split(/\s+/);
	const initials = [...firstWord].slice(0, 2).join("");

	return initials.length > 0 ? initials.toUpperCase() : "?";
}

function InterviewCard({
	request,
	onUpdateClick,
	onDeleteClick,
}: {
	request: InterviewCardData;
	onUpdateClick: (request: InterviewCardData) => void;
	onDeleteClick: (request: InterviewCardData) => void;
}) {
	const meta = STATUS_META[request.status];

	return (
		<article className="flex flex-col overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_-12px_rgba(15,23,42,0.12)]">
			<div
				className="flex items-start justify-between gap-3 border-b px-5 py-[13px]"
				style={{ backgroundColor: meta.tint, borderBottomColor: meta.border }}
			>
				<div className="flex min-w-0 flex-col gap-[5px]">
					<span
						className="inline-flex items-center gap-2 text-[12.5px] font-extrabold tracking-[0.05em] uppercase"
						style={{ color: meta.text }}
					>
						<span
							aria-hidden
							className="size-[9px] rounded-full shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
							style={{ backgroundColor: meta.dot }}
						/>
						{meta.label}
					</span>
					{request.notes ? (
						<span className="flex items-start gap-1.5 pl-px text-xs leading-[1.4] font-medium text-[#64748b]">
							<span aria-hidden className="mt-px text-[11px]">
								🗒
							</span>
							<span className="sr-only">Nota interna: </span>
							{request.notes}
						</span>
					) : null}
				</div>
				<span className="mt-0.5 text-xs font-semibold whitespace-nowrap text-[#64748b]">
					{request.dateLabel}
				</span>
			</div>

			<div className="flex flex-1 flex-col px-[22px] pt-5 pb-[22px]">
				<div className="mb-4 flex items-center gap-3">
					<div
						aria-hidden
						className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] text-[15px] font-extrabold"
						style={{ backgroundColor: meta.tint, color: meta.text }}
					>
						{getInitials(request.contact_name)}
					</div>
					<div>
						<h2 className="m-0 text-left text-lg font-extrabold tracking-[-0.01em] normal-case text-[#1e293b]">
							{request.contact_name}
						</h2>
						<p className="mt-0.5 text-[12.5px] leading-normal text-[#94a3b8]">
							{request.patient_name
								? `Paciente: ${request.patient_name}`
								: "Sin paciente indicado"}
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-[11px]">
					<div className="flex items-center gap-2.5">
						<span
							aria-hidden
							className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f1f5f9] text-sm text-[#64748b]"
						>
							✆
						</span>
						<a
							className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
							href={`tel:${request.phone.replace(/\s/g, "")}`}
						>
							<span className="sr-only">Teléfono: </span>
							{request.phone}
						</a>
					</div>
					<div className="flex items-center gap-2.5">
						<span
							aria-hidden
							className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[13px] text-[#64748b]"
						>
							✉
						</span>
						{request.email ? (
							<a
								className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
								href={`mailto:${request.email}`}
							>
								<span className="sr-only">Email: </span>
								{request.email}
							</a>
						) : (
							<span className="text-sm text-[#94a3b8]">No informado</span>
						)}
					</div>
				</div>

				<div className="mt-3.5 flex-1 rounded-[10px] border border-[#eef2f7] bg-[#f8fafc] px-[13px] py-[11px]">
					<div className="mb-1 text-[10.5px] font-bold tracking-[0.07em] text-[#94a3b8] uppercase">
						Mensaje original
					</div>
					<p className="m-0 text-sm leading-[1.5] whitespace-pre-wrap text-[#334155]">
						{request.message ? `"${request.message}"` : "Sin mensaje adicional."}
					</p>
				</div>

				<div className="mt-4 flex items-stretch gap-2.5">
					<button
						type="button"
						className={cn(
							"inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border p-[11px] text-[13.5px] font-bold",
							meta.updateButtonClassName,
						)}
						onClick={() => onUpdateClick(request)}
					>
						<span aria-hidden className="text-sm leading-none">
							↻
						</span>
						Actualizar estado de la entrevista
					</button>
					{/*
					  Deliberately one step stronger than the REJECTED palette so the
					  destructive affordance still stands out on a rejected card.
					  aspect-square + the row's items-stretch keep it 1:1 with the
					  update button's height.
					*/}
					<button
						type="button"
						className="flex aspect-square cursor-pointer items-center justify-center rounded-[10px] border border-[#f87171] bg-[#fecaca] text-[#b91c1c] hover:bg-[#fca5a5]"
						onClick={() => onDeleteClick(request)}
					>
						<Trash2 className="size-4" aria-hidden="true" />
						<span className="sr-only">Eliminar entrevista</span>
					</button>
				</div>
			</div>
		</article>
	);
}

export function InterviewsAdmin({
	requests,
	initialStatus,
}: {
	requests: InterviewCardData[];
	initialStatus: InterviewRequestStatus | null;
}) {
	const [filter, setFilter] = useState<StatusFilter>(initialStatus ?? "ALL");
	const [activeId, setActiveId] = useState<string | null>(null);
	const [selectedStatus, setSelectedStatus] =
		useState<InterviewRequestStatus>("PENDING");
	const [toast, setToast] = useState<{ message: string } | null>(null);
	const [state, formAction, isPending] = useActionState(
		updateInterviewRequestCrm,
		IDLE_STATE,
	);
	const [seenState, setSeenState] = useState(state);
	const [stateAtOpen, setStateAtOpen] = useState(state);
	// One board-level confirm dialog for every card; the target names the
	// request in the copy and provides the id on confirm.
	const [deleteTarget, setDeleteTarget] = useState<InterviewCardData | null>(
		null,
	);
	const { confirmOpen, setConfirmOpen, isDeleting, handleDelete } =
		useDeleteAction(deleteInterviewRequest);

	// React to the completed submission exactly once, during render (same
	// pattern as use-action-dialog): close the modal and queue the toast on
	// success. The action's revalidatePath refreshes the server page, so the
	// cards re-render from props with the new status and notes.
	if (state !== seenState) {
		setSeenState(state);
		if (state.status === "success") {
			setActiveId(null);
			setToast({
				message: `Estado actualizado a “${STATUS_META[selectedStatus].label}”`,
			});
		}
	}

	// Auto-dismiss: `toast` is a fresh object per save, so a new save always
	// resets the timer, and unmounting clears any pending one.
	useEffect(() => {
		if (!toast) {
			return;
		}

		const timer = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
		return () => clearTimeout(timer);
	}, [toast]);

	// Derived from props on purpose: after the action revalidates, the fresh
	// server data flows into the open modal and the cards without local copies.
	const activeRequest = activeId
		? requests.find((request) => request.id === activeId)
		: undefined;
	// Hide errors produced before this open (e.g. a failed save on another card).
	const errorMessage =
		state.status === "error" && state !== stateAtOpen ? state.message : null;

	const statusCounts: Record<InterviewRequestStatus, number> = {
		PENDING: 0,
		CONTACTED: 0,
		CONFIRMED: 0,
		REJECTED: 0,
	};
	for (const request of requests) {
		statusCounts[request.status] += 1;
	}

	const visibleRequests =
		filter === "ALL"
			? requests
			: requests.filter((request) => request.status === filter);

	function openUpdateModal(request: InterviewCardData) {
		setActiveId(request.id);
		setSelectedStatus(request.status);
		setStateAtOpen(state);
	}

	function openDeleteConfirm(request: InterviewCardData) {
		setDeleteTarget(request);
		setConfirmOpen(true);
	}

	return (
		<div>
			<div className="mb-7 flex flex-wrap items-center gap-2.5 border-b border-[#e6ebf1] pb-6">
				{FILTER_CHIPS.map((chip) => {
					const isActive = filter === chip.value;
					const meta = chip.value === "ALL" ? null : STATUS_META[chip.value];
					const count =
						chip.value === "ALL" ? requests.length : statusCounts[chip.value];

					return (
						<button
							key={chip.value}
							type="button"
							aria-pressed={isActive}
							className={cn(
								"inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-[15px] py-[9px] text-sm font-bold whitespace-nowrap transition-all duration-[120ms]",
								!isActive && "border-[#e2e8f0] bg-white text-[#475569]",
								isActive && !meta && "border-[#0f172a] bg-[#0f172a] text-white",
							)}
							style={
								isActive && meta
									? {
											color: meta.text,
											backgroundColor: meta.tint,
											borderColor: meta.dot,
										}
									: undefined
							}
							onClick={() => setFilter(chip.value)}
						>
							<span
								aria-hidden
								className="size-2 rounded-full"
								style={{ backgroundColor: meta ? meta.dot : ALL_FILTER_DOT_COLOR }}
							/>
							{chip.label}
							<span
								className={cn(
									"rounded-full px-[7px] py-px text-[11.5px] font-extrabold",
									!isActive && "bg-[#f1f5f9] text-[#94a3b8]",
									isActive && meta && "text-white",
									isActive && !meta && "bg-white/[0.22]",
								)}
								style={
									isActive && meta ? { backgroundColor: meta.dot } : undefined
								}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			<div className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-5">
				{visibleRequests.map((request) => (
					<InterviewCard
						key={request.id}
						request={request}
						onUpdateClick={openUpdateModal}
						onDeleteClick={openDeleteConfirm}
					/>
				))}
				{visibleRequests.length === 0 ? (
					<div className="col-span-full px-5 py-14 text-center text-[15px] text-[#94a3b8]">
						No hay entrevistas con este estado.
					</div>
				) : null}
			</div>

			{/*
			  Built on the base-ui primitives instead of the shared ui/dialog
			  wrapper: DialogContent bakes in zoom-in-95/duration-100 animation
			  classes that tailwind-merge cannot replace, and the mock needs a
			  220ms cubic-bezier entrance with zoom-in-98 plus edge-to-edge
			  header/footer bands.
			*/}
			<DialogPrimitive.Root
				open={activeRequest !== undefined}
				onOpenChange={(open) => {
					if (!open) {
						setActiveId(null);
					}
				}}
			>
				{activeRequest ? (
					<DialogPrimitive.Portal>
						<DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#0f172a]/50 duration-[180ms] supports-backdrop-filter:backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0" />
						<DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-48px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[18px] bg-white text-[#1e293b] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.4)] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-98 data-open:slide-in-from-bottom-2">
							<div className="flex items-start justify-between gap-3 border-b border-[#f1f5f9] px-6 pt-[22px] pb-[18px]">
								<div>
									<DialogPrimitive.Title
										render={<h3 />}
										className="m-0 text-lg font-extrabold tracking-[-0.01em] normal-case text-[#1e293b]"
									>
										Actualizar entrevista
									</DialogPrimitive.Title>
									<DialogPrimitive.Description className="m-0 mt-[5px] text-[13.5px] leading-normal text-[#64748b]">
										{activeRequest.contact_name} · registra el nuevo estado del
										contacto
									</DialogPrimitive.Description>
								</div>
								<DialogPrimitive.Close className="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[#f1f5f9] text-lg leading-none text-[#475569] hover:bg-[#e2e8f0]">
									<span aria-hidden>✕</span>
									<span className="sr-only">Cerrar</span>
								</DialogPrimitive.Close>
							</div>

							<form action={formAction}>
								<input type="hidden" name="id" value={activeRequest.id} />
								<input type="hidden" name="status" value={selectedStatus} />
								<div className="px-6 py-[22px]">
									<div className="mb-[11px] text-xs font-bold tracking-[0.07em] text-[#94a3b8] uppercase">
										Estado CRM
									</div>
									<div className="grid grid-cols-2 gap-2.5">
										{STATUS_ORDER.map((status) => {
											const meta = STATUS_META[status];
											const isSelected = selectedStatus === status;

											return (
												<button
													key={status}
													type="button"
													disabled={isPending}
													aria-pressed={isSelected}
													className={cn(
														"flex cursor-pointer items-center gap-[9px] rounded-[11px] border-2 px-3.5 py-3 text-sm font-bold transition-all duration-[120ms]",
														!isSelected && "border-[#e2e8f0] bg-white text-[#475569]",
													)}
													style={
														isSelected
															? {
																	color: meta.text,
																	backgroundColor: meta.tint,
																	borderColor: meta.dot,
																}
															: undefined
													}
													onClick={() => setSelectedStatus(status)}
												>
													<span
														aria-hidden
														className="size-2.5 shrink-0 rounded-full"
														style={{ backgroundColor: meta.dot }}
													/>
													<span className="flex-1 text-left">{meta.label}</span>
													{isSelected ? (
														<span aria-hidden className="text-sm font-extrabold">
															✓
														</span>
													) : null}
												</button>
											);
										})}
									</div>

									<div className="mt-[22px] mb-[9px] text-xs font-bold tracking-[0.07em] text-[#94a3b8] uppercase">
										Notas internas
									</div>
									<Textarea
										name="notes"
										defaultValue={activeRequest.notes ?? ""}
										maxLength={2000}
										placeholder="Ej.: dejó mensaje, coordinar llamada el martes…"
										className="field-sizing-fixed min-h-[88px] resize-y rounded-[11px] border-[#cbd5e1] px-3.5 py-3 text-sm leading-[1.5] text-[#334155] focus-visible:border-[#2563eb] focus-visible:ring-[#2563eb]/[0.12]"
									/>
									{errorMessage ? (
										<div className="mt-3">
											<FormError message={errorMessage} />
										</div>
									) : null}
								</div>

								<div className="flex justify-end gap-2.5 border-t border-[#f1f5f9] bg-[#fafbfc] px-6 py-4">
									<DialogPrimitive.Close className="cursor-pointer rounded-[9px] border border-[#cbd5e1] bg-white px-[18px] py-2.5 text-sm font-bold text-[#475569] hover:bg-[#f1f5f9]">
										Cancelar
									</DialogPrimitive.Close>
									<SubmitButton
										pendingLabel="Guardando…"
										className="h-auto rounded-[9px] bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1d4ed8]"
									>
										Guardar cambios
									</SubmitButton>
								</div>
							</form>
						</DialogPrimitive.Popup>
					</DialogPrimitive.Portal>
				) : null}
			</DialogPrimitive.Root>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Eliminar entrevista"
				description={
					deleteTarget
						? `¿Eliminar la entrevista de ${deleteTarget.contact_name}? Esta acción no se puede deshacer.`
						: undefined
				}
				confirmLabel="Eliminar"
				onConfirm={() => {
					if (deleteTarget) {
						handleDelete(deleteTarget.id);
					}
				}}
				pending={isDeleting}
				destructive
			/>

			{toast ? (
				<div
					role="status"
					className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-[12px] bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(15,23,42,0.5)] duration-200 animate-in fade-in-0 zoom-in-98 slide-in-from-bottom-2"
				>
					<span aria-hidden className="text-base text-[#4ade80]">
						✓
					</span>
					{toast.message}
				</div>
			) : null}
		</div>
	);
}

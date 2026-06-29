"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import {
	buildAdminSiteSettings,
	getSiteSettingDefinition,
	normalizeSiteSettingValue,
	type AdminSiteSetting,
	type SiteSettingRow,
} from "@/lib/site-settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage, deleteImage } from "@/lib/supabase/storage";

export type AdminProfessional = {
	id: string;
	first_name: string;
	last_name: string;
	role: string;
	bio: string | null;
	image_url: string | null;
	is_active: boolean;
	order_index: number;
};

export type AdminActivity = {
	id: string;
	title: string;
	description: string;
	category: string;
	icon: ActivityIconValue;
	image_url: string | null;
	schedule_info: string | null;
	is_active: boolean;
	order_index: number;
};

export type AdminGalleryItem = {
	id: string;
	title: string;
	category: string;
	image_url: string;
	is_active: boolean;
	order_index: number;
};

export type AdminHomeObjective = {
	id: string;
	title: string;
	description: string;
	icon: string | null;
	is_active: boolean;
	order_index: number;
};

export type InterviewRequestStatus =
	| "PENDING"
	| "CONTACTED"
	| "CONFIRMED"
	| "REJECTED";

export type AdminInterviewRequest = {
	id: string;
	contact_name: string;
	patient_name: string | null;
	phone: string;
	email: string | null;
	message: string | null;
	status: InterviewRequestStatus;
	notes: string | null;
	created_at: string;
};

export type LatestInterviewRequest = {
	id: string;
	contact_name: string;
	patient_name: string | null;
	phone: string;
	status: InterviewRequestStatus;
	created_at: string;
};

export type EntityCounts = {
	active: number;
	total: number;
};

export type InterviewStatusBreakdown = Record<InterviewRequestStatus, number>;

export type AdminDashboardData = {
	pendingInterviewRequests: number;
	professionals: EntityCounts;
	activities: EntityCounts;
	galleryItems: EntityCounts;
	homeObjectives: EntityCounts;
	interviewStatusBreakdown: InterviewStatusBreakdown;
	interviewRequestsThisWeek: number;
	totalInterviewRequests: number;
	latestInterviewRequests: LatestInterviewRequest[];
};

type SupabaseResponse<T> = {
	data: T | null;
	error: { message: string } | null;
};

type SupabaseCountResponse = {
	count: number | null;
	error: { message: string } | null;
};

const INTERVIEW_REQUEST_STATUSES: InterviewRequestStatus[] = [
	"PENDING",
	"CONTACTED",
	"CONFIRMED",
	"REJECTED",
];

const ACTIVITY_ICON_VALUES = [
	"heart",
	"thumbs-up",
	"music",
	"shop",
	"pencil",
] as const;

type ActivityIconValue = (typeof ACTIVITY_ICON_VALUES)[number];

const MAX_INTERVIEW_NOTES_LENGTH = 2000;

function isInterviewRequestStatus(
	value: string,
): value is InterviewRequestStatus {
	return INTERVIEW_REQUEST_STATUSES.includes(value as InterviewRequestStatus);
}

/**
 * Tags infrastructure/DB failures so the action boundary (`toActionError`) can
 * tell them apart from user-facing validation errors. The detailed `message`
 * (table name + Postgres detail) is logged server-side only; the client gets a
 * generic message instead, so we never leak schema internals to the browser.
 */
class AdminInfraError extends Error {
	readonly operation: string;

	constructor(operation: string, detail: string) {
		super(`Supabase ${operation}: ${detail}`);
		this.name = "AdminInfraError";
		this.operation = operation;
	}
}

const GENERIC_INFRA_ERROR_MESSAGE = "No se pudo guardar. Intentá nuevamente.";

function assertMutationSucceeded(
	tableName: string,
	error: { message: string } | null,
) {
	if (error) {
		throw new AdminInfraError(`mutation failed for ${tableName}`, error.message);
	}
}

function assertReadSucceeded<T>(
	tableName: string,
	response: SupabaseResponse<T>,
): T {
	if (response.error) {
		throw new AdminInfraError(
			`admin read failed for ${tableName}`,
			response.error.message,
		);
	}

	if (!response.data) {
		throw new AdminInfraError(
			`admin read returned no data for ${tableName}`,
			"empty result",
		);
	}

	return response.data;
}

function assertCountSucceeded(
	tableName: string,
	response: SupabaseCountResponse,
) {
	if (response.error) {
		throw new AdminInfraError(
			`count failed for ${tableName}`,
			response.error.message,
		);
	}

	return response.count ?? 0;
}

function getRequiredString(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`El campo ${key} es obligatorio`);
	}

	return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getCheckboxBoolean(
	formData: FormData,
	key: string,
	defaultValue = false,
) {
	const value = formData.get(key);

	if (value === null) {
		return defaultValue;
	}

	return value === "on" || value === "true" || value === "1";
}

function normalizeActivityIcon(
	value: FormDataEntryValue | null,
): ActivityIconValue {
	if (typeof value !== "string") {
		return "heart";
	}

	const trimmed = value.trim();

	if (ACTIVITY_ICON_VALUES.includes(trimmed as ActivityIconValue)) {
		return trimmed as ActivityIconValue;
	}

	return "heart";
}

function revalidateProfessionalPaths() {
	revalidatePath("/admin/dashboard");
	revalidatePath("/admin/profesionales");
	revalidatePath("/");
}

function revalidateActivityPaths() {
	revalidatePath("/admin/dashboard");
	revalidatePath("/admin/actividades");
	revalidatePath("/");
}

function revalidateGalleryPaths() {
	revalidatePath("/admin/galeria");
	revalidatePath("/");
}

function revalidateSiteSettingPaths() {
	revalidatePath("/");
	revalidatePath("/admin/configuracion");
}

function revalidateInterviewCrmPaths() {
	revalidatePath("/admin/dashboard");
	revalidatePath("/admin/entrevistas");
}

/**
 * Serializable result returned by create/update actions so client islands can
 * drive them with `useActionState` and close the dialog on success (instead of
 * redirecting). Errors are returned in-band rather than thrown so the UI can
 * surface a message without an error boundary.
 */
export type ActionResult =
	| { status: "idle" }
	| { status: "success" }
	| { status: "error"; message: string };

function toActionError(error: unknown): ActionResult {
	if (error instanceof AdminInfraError) {
		// Infra/DB failures can carry table names and Postgres detail. Log the
		// full error server-side and return a generic message so we never leak
		// schema internals to the client.
		console.error("Admin infra error", {
			operation: error.operation,
			detail: error.message,
		});
		return { status: "error", message: GENERIC_INFRA_ERROR_MESSAGE };
	}

	// Validation errors (getRequiredString / getOptional* / auth) are safe and
	// user-facing — surface their message verbatim.
	return {
		status: "error",
		message: error instanceof Error ? error.message : "Error desconocido",
	};
}

/**
 * Computes the next order_index for a new row as max(order_index) + 1 via a
 * single pre-insert read. New records always land at the end of the list, so
 * the form no longer needs an order_index input.
 */
async function getNextOrderIndex(
	supabase: ReturnType<typeof createAdminClient>,
	tableName: string,
): Promise<number> {
	const response = (await supabase
		.from(tableName)
		.select("order_index")
		.order("order_index", { ascending: false })
		.limit(1)
		.maybeSingle()) as SupabaseResponse<{ order_index: number }>;

	if (response.error) {
		throw new AdminInfraError(
			`admin read failed for ${tableName}`,
			response.error.message,
		);
	}

	// Empty table → maybeSingle returns data: null → first row lands at 0.
	return (response.data?.order_index ?? -1) + 1;
}

const REORDERABLE_TABLES = {
	professionals: revalidateProfessionalPaths,
	activities: revalidateActivityPaths,
	gallery_items: revalidateGalleryPaths,
	home_objectives: revalidateObjectivePaths,
} as const;

export type ReorderableTable = keyof typeof REORDERABLE_TABLES;

/**
 * Persists a manual drag-and-drop ordering. Each id's array position becomes
 * its order_index. Admin lists are tiny (< 50 rows) and reorder is a rare
 * manual action, so per-row updates run in parallel via Promise.all (no RPC,
 * no migration).
 */
export async function reorderRecords(
	table: ReorderableTable,
	ids: string[],
): Promise<void> {
	await requireAdmin();

	// Server-action arguments are untrusted at runtime regardless of the TS type,
	// so this guard validates the `table` arg crossing the action boundary before
	// it reaches the query builder.
	const revalidate = REORDERABLE_TABLES[table];

	if (!revalidate) {
		throw new Error(`Tabla no reordenable: ${table}`);
	}

	if (ids.length === 0) {
		return;
	}

	const supabase = createAdminClient();
	// Not atomic: per-row updates run in parallel without a transaction. Acceptable
	// for tiny admin lists — a partial failure self-heals on the next refresh.
	const results = await Promise.all(
		ids.map((id, index) =>
			supabase.from(table).update({ order_index: index }).eq("id", id),
		),
	);

	for (const result of results) {
		assertMutationSucceeded(table, (result as SupabaseResponse<unknown>).error);
	}

	revalidate();
}

export async function getAdminObjectives(): Promise<AdminHomeObjective[]> {
	await requireAdmin();

	const supabase = createAdminClient();
	const response = await supabase
		.from("home_objectives")
		.select("id, title, description, icon, is_active, order_index")
		.order("order_index", { ascending: true })
		.order("title", { ascending: true });

	return assertReadSucceeded(
		"home_objectives",
		response as SupabaseResponse<AdminHomeObjective[]>,
	);
}

export async function getAdminProfessionals(): Promise<AdminProfessional[]> {
	await requireAdmin();

	const supabase = createAdminClient();
	const response = await supabase
		.from("professionals")
		.select(
			"id, first_name, last_name, role, bio, image_url, is_active, order_index",
		)
		.order("order_index", { ascending: true })
		.order("last_name", { ascending: true });

	return assertReadSucceeded(
		"professionals",
		response as SupabaseResponse<AdminProfessional[]>,
	);
}

export async function getAdminActivities(): Promise<AdminActivity[]> {
	await requireAdmin();

	const supabase = createAdminClient();
	const response = await supabase
		.from("activities")
		.select(
			"id, title, description, category, icon, image_url, schedule_info, is_active, order_index",
		)
		.order("order_index", { ascending: true })
		.order("title", { ascending: true });

	return assertReadSucceeded(
		"activities",
		response as SupabaseResponse<AdminActivity[]>,
	);
}

export async function getAdminGalleryItems(): Promise<AdminGalleryItem[]> {
	await requireAdmin();

	const supabase = createAdminClient();
	const response = await supabase
		.from("gallery_items")
		.select("id, title, category, image_url, is_active, order_index")
		.order("order_index", { ascending: true })
		.order("title", { ascending: true });

	return assertReadSucceeded(
		"gallery_items",
		response as SupabaseResponse<AdminGalleryItem[]>,
	);
}

export async function getAdminInterviewRequests(
	status?: string | null,
): Promise<AdminInterviewRequest[]> {
	await requireAdmin();

	const statusFilter = status?.trim();

	if (statusFilter && !isInterviewRequestStatus(statusFilter)) {
		throw new Error(`Estado de entrevista inválido: ${statusFilter}`);
	}

	const supabase = createAdminClient();
	const query = supabase
		.from("interview_requests")
		.select(
			"id, contact_name, patient_name, phone, email, message, status, notes, created_at",
		);

	if (statusFilter) {
		query.eq("status", statusFilter);
	}

	const response = await query.order("created_at", { ascending: false });

	return assertReadSucceeded(
		"interview_requests",
		response as SupabaseResponse<AdminInterviewRequest[]>,
	);
}

type InterviewStatusRow = {
	status: InterviewRequestStatus;
	created_at: string;
};

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
	await requireAdmin();

	const supabase = createAdminClient();

	// Parallel reads (no waterfall): 8 head-only count queries for the four
	// entities' active/total, one light status+created_at scan for the interview
	// breakdown, and the latest-requests list. The interview status counts
	// (pending, breakdown, this-week, total) are derived in JS from a single
	// scan instead of issuing one count query per status.
	const [
		professionalsActive,
		professionalsTotal,
		activitiesActive,
		activitiesTotal,
		galleryActive,
		galleryTotal,
		objectivesActive,
		objectivesTotal,
		interviewStatusRows,
		latestRequests,
	] = await Promise.all([
		supabase
			.from("professionals")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true),
		supabase
			.from("professionals")
			.select("id", { count: "exact", head: true }),
		supabase
			.from("activities")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true),
		supabase.from("activities").select("id", { count: "exact", head: true }),
		supabase
			.from("gallery_items")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true),
		supabase
			.from("gallery_items")
			.select("id", { count: "exact", head: true }),
		supabase
			.from("home_objectives")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true),
		supabase
			.from("home_objectives")
			.select("id", { count: "exact", head: true }),
		supabase.from("interview_requests").select("status, created_at"),
		supabase
			.from("interview_requests")
			.select("id, contact_name, patient_name, phone, status, created_at")
			.order("created_at", { ascending: false })
			.limit(5),
	]);

	const statusRows = assertReadSucceeded(
		"interview_requests",
		interviewStatusRows as SupabaseResponse<InterviewStatusRow[]>,
	);

	const interviewStatusBreakdown: InterviewStatusBreakdown = {
		PENDING: 0,
		CONTACTED: 0,
		CONFIRMED: 0,
		REJECTED: 0,
	};

	const weekThreshold = Date.now() - WEEK_IN_MS;
	let interviewRequestsThisWeek = 0;

	for (const row of statusRows) {
		if (isInterviewRequestStatus(row.status)) {
			interviewStatusBreakdown[row.status] += 1;
		}

		if (new Date(row.created_at).getTime() >= weekThreshold) {
			interviewRequestsThisWeek += 1;
		}
	}

	return {
		pendingInterviewRequests: interviewStatusBreakdown.PENDING,
		professionals: {
			active: assertCountSucceeded(
				"professionals",
				professionalsActive as SupabaseCountResponse,
			),
			total: assertCountSucceeded(
				"professionals",
				professionalsTotal as SupabaseCountResponse,
			),
		},
		activities: {
			active: assertCountSucceeded(
				"activities",
				activitiesActive as SupabaseCountResponse,
			),
			total: assertCountSucceeded(
				"activities",
				activitiesTotal as SupabaseCountResponse,
			),
		},
		galleryItems: {
			active: assertCountSucceeded(
				"gallery_items",
				galleryActive as SupabaseCountResponse,
			),
			total: assertCountSucceeded(
				"gallery_items",
				galleryTotal as SupabaseCountResponse,
			),
		},
		homeObjectives: {
			active: assertCountSucceeded(
				"home_objectives",
				objectivesActive as SupabaseCountResponse,
			),
			total: assertCountSucceeded(
				"home_objectives",
				objectivesTotal as SupabaseCountResponse,
			),
		},
		interviewStatusBreakdown,
		interviewRequestsThisWeek,
		totalInterviewRequests: statusRows.length,
		latestInterviewRequests: assertReadSucceeded(
			"interview_requests",
			latestRequests as SupabaseResponse<LatestInterviewRequest[]>,
		),
	};
}

export async function getAdminSiteSettings(): Promise<AdminSiteSetting[]> {
	await requireAdmin();

	const supabase = createAdminClient();
	const response = await supabase
		.from("site_settings")
		.select(
			"setting_key, setting_value, setting_type, setting_group, description",
		);

	const rows = assertReadSucceeded(
		"site_settings",
		response as SupabaseResponse<SiteSettingRow[]>,
	);

	return buildAdminSiteSettings(rows);
}

export async function updateSiteSetting(formData: FormData) {
	await requireAdmin();

	const settingKey = getRequiredString(formData, "setting_key");
	const settingType = getRequiredString(formData, "setting_type");
	const rawValue = formData.get("setting_value");

	if (typeof rawValue !== "string") {
		throw new Error("El valor de configuración es obligatorio");
	}

	const normalizedValue = normalizeSiteSettingValue(
		settingKey,
		rawValue,
		settingType,
	);
	const definition = getSiteSettingDefinition(settingKey);

	if (!definition) {
		throw new Error(`Configuración desconocida: ${settingKey}`);
	}

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("site_settings")
		.update({
			setting_group: definition.group,
			setting_value: normalizedValue,
			setting_type: definition.type,
			description: definition.description,
			updated_at: new Date().toISOString(),
		})
		.eq("setting_key", definition.key);

	assertMutationSucceeded("site_settings", error);
	revalidateSiteSettingPaths();
}

export async function updateInterviewRequestCrm(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const status = getRequiredString(formData, "status");

	if (!isInterviewRequestStatus(status)) {
		throw new Error(`Estado de entrevista inválido: ${status}`);
	}

	const notes = getOptionalString(formData, "notes");

	if (notes && notes.length > MAX_INTERVIEW_NOTES_LENGTH) {
		throw new Error(
			`Las notas internas no pueden superar ${MAX_INTERVIEW_NOTES_LENGTH} caracteres`,
		);
	}

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("interview_requests")
		.update({ status, notes })
		.eq("id", id);

	assertMutationSucceeded("interview_requests", error);
	revalidateInterviewCrmPaths();
}

export async function createProfessional(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		let imageUrl: string = "/profile.jpg";
		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		if (hasUpload) {
			imageUrl = await uploadImage(file, "professionals");
		} else {
			imageUrl = getOptionalString(formData, "image_url") ?? "/profile.jpg";
		}

		const supabase = createAdminClient();
		const orderIndex = await getNextOrderIndex(supabase, "professionals");
		const { error } = await supabase.from("professionals").insert({
			first_name: getRequiredString(formData, "first_name"),
			last_name: getRequiredString(formData, "last_name"),
			role: getRequiredString(formData, "role"),
			bio: getOptionalString(formData, "bio"),
			image_url: imageUrl,
			is_active: true,
			order_index: orderIndex,
		});

		if (error) {
			if (hasUpload) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("professionals", error);
		}

		revalidateProfessionalPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function updateProfessional(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const id = getRequiredString(formData, "id");
		const existingImageUrl = getOptionalString(formData, "existing_image_url");

		let imageUrl = existingImageUrl;
		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		if (hasUpload) {
			imageUrl = await uploadImage(file, "professionals");
		}

		const supabase = createAdminClient();
		const { error } = await supabase
			.from("professionals")
			.update({
				first_name: getRequiredString(formData, "first_name"),
				last_name: getRequiredString(formData, "last_name"),
				role: getRequiredString(formData, "role"),
				bio: getOptionalString(formData, "bio"),
				image_url: imageUrl,
				is_active: formData.get("is_active") === "on",
			})
			.eq("id", id);

		if (error) {
			if (hasUpload && imageUrl) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("professionals", error);
		}

		if (hasUpload && existingImageUrl) {
			await deleteImage(existingImageUrl);
		}

		revalidateProfessionalPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function deleteProfessional(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const supabase = createAdminClient();

	// Get current professional's image URL first
	const { data: profData } = await supabase
		.from("professionals")
		.select("image_url")
		.eq("id", id)
		.single();

	const { error } = await supabase.from("professionals").delete().eq("id", id);

	assertMutationSucceeded("professionals", error);

	if (profData?.image_url) {
		await deleteImage(profData.image_url);
	}

	revalidateProfessionalPaths();
}

export async function createActivity(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		let imageUrl = getOptionalString(formData, "image_url");
		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		if (hasUpload) {
			imageUrl = await uploadImage(file, "activities");
		}

		const supabase = createAdminClient();
		const orderIndex = await getNextOrderIndex(supabase, "activities");
		const payload = {
			title: getRequiredString(formData, "title"),
			description: getRequiredString(formData, "description"),
			category: getRequiredString(formData, "category"),
			icon: normalizeActivityIcon(formData.get("icon")),
			image_url: imageUrl,
			schedule_info: getOptionalString(formData, "schedule_info"),
			is_active: getCheckboxBoolean(formData, "is_active", true),
			order_index: orderIndex,
		};

		const { error } = await supabase.from("activities").insert(payload);

		if (error) {
			if (hasUpload && imageUrl) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("activities", error);
		}

		revalidateActivityPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function updateActivity(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const id = getRequiredString(formData, "id");
		const existingImageUrl = getOptionalString(formData, "existing_image_url");

		let imageUrl = existingImageUrl;
		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		if (hasUpload) {
			imageUrl = await uploadImage(file, "activities");
		}

		// The activities form has no image input, so neither image_file nor
		// existing_image_url is present on a normal edit. Only include image_url
		// when an image is actually provided (fresh upload or an explicit
		// existing_image_url) — omitting the column preserves the stored value
		// instead of nulling it. Mirrors how objectives preserves its icon.
		const payload = {
			title: getRequiredString(formData, "title"),
			description: getRequiredString(formData, "description"),
			category: getRequiredString(formData, "category"),
			icon: normalizeActivityIcon(formData.get("icon")),
			...(imageUrl != null ? { image_url: imageUrl } : {}),
			schedule_info: getOptionalString(formData, "schedule_info"),
			is_active: getCheckboxBoolean(formData, "is_active"),
		};

		const supabase = createAdminClient();
		const { error } = await supabase
			.from("activities")
			.update(payload)
			.eq("id", id);

		if (error) {
			if (hasUpload && imageUrl) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("activities", error);
		}

		if (hasUpload && existingImageUrl) {
			await deleteImage(existingImageUrl);
		}

		revalidateActivityPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function toggleActivity(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const isActive = getCheckboxBoolean(formData, "is_active");

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("activities")
		.update({ is_active: isActive })
		.eq("id", id);

	assertMutationSucceeded("activities", error);
	revalidateActivityPaths();
}

export async function deleteActivity(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const supabase = createAdminClient();

	// Fetch record image URL before delete
	const { data: actData } = await supabase
		.from("activities")
		.select("image_url")
		.eq("id", id)
		.single();

	const { error } = await supabase.from("activities").delete().eq("id", id);

	assertMutationSucceeded("activities", error);

	if (actData?.image_url) {
		await deleteImage(actData.image_url);
	}

	revalidateActivityPaths();
}

export async function createGalleryItem(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		let imageUrl = "";
		if (hasUpload) {
			imageUrl = await uploadImage(file, "gallery");
		} else {
			imageUrl = getRequiredString(formData, "image_url");
		}

		const supabase = createAdminClient();
		const orderIndex = await getNextOrderIndex(supabase, "gallery_items");
		const payload = {
			title: getRequiredString(formData, "title"),
			category: getRequiredString(formData, "category"),
			image_url: imageUrl,
			is_active: getCheckboxBoolean(formData, "is_active", true),
			order_index: orderIndex,
		};

		const { error } = await supabase.from("gallery_items").insert(payload);

		if (error) {
			if (hasUpload) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("gallery_items", error);
		}

		revalidateGalleryPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function updateGalleryItem(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const id = getRequiredString(formData, "id");
		const existingImageUrl = getOptionalString(formData, "existing_image_url");

		let imageUrl = existingImageUrl;
		const file = formData.get("image_file") as File | null;
		const hasUpload = file && file.size > 0;

		if (hasUpload) {
			imageUrl = await uploadImage(file, "gallery");
		}

		const payload = {
			title: getRequiredString(formData, "title"),
			category: getRequiredString(formData, "category"),
			image_url: imageUrl,
			is_active: getCheckboxBoolean(formData, "is_active"),
		};

		const supabase = createAdminClient();
		const { error } = await supabase
			.from("gallery_items")
			.update(payload)
			.eq("id", id);

		if (error) {
			if (hasUpload && imageUrl) {
				await deleteImage(imageUrl);
			}
			assertMutationSucceeded("gallery_items", error);
		}

		if (hasUpload && existingImageUrl) {
			await deleteImage(existingImageUrl);
		}

		revalidateGalleryPaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function toggleGalleryItem(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const isActive = getCheckboxBoolean(formData, "is_active");

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("gallery_items")
		.update({ is_active: isActive })
		.eq("id", id);

	assertMutationSucceeded("gallery_items", error);
	revalidateGalleryPaths();
}

export async function deleteGalleryItem(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const supabase = createAdminClient();

	// Fetch record image URL before delete
	const { data: itemData } = await supabase
		.from("gallery_items")
		.select("image_url")
		.eq("id", id)
		.single();

	const { error } = await supabase.from("gallery_items").delete().eq("id", id);

	assertMutationSucceeded("gallery_items", error);

	if (itemData?.image_url) {
		await deleteImage(itemData.image_url);
	}

	revalidateGalleryPaths();
}

function revalidateObjectivePaths() {
	revalidatePath("/admin/dashboard");
	revalidatePath("/admin/objetivos");
	revalidatePath("/");
}

export async function createHomeObjective(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const supabase = createAdminClient();
		const orderIndex = await getNextOrderIndex(supabase, "home_objectives");
		const { error } = await supabase.from("home_objectives").insert({
			title: getRequiredString(formData, "title"),
			description: getRequiredString(formData, "description"),
			icon: getOptionalString(formData, "icon") ?? "fa-check",
			is_active: true,
			order_index: orderIndex,
		});

		assertMutationSucceeded("home_objectives", error);
		revalidateObjectivePaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function updateHomeObjective(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	try {
		await requireAdmin();

		const id = getRequiredString(formData, "id");
		const supabase = createAdminClient();
		const { error } = await supabase
			.from("home_objectives")
			.update({
				title: getRequiredString(formData, "title"),
				description: getRequiredString(formData, "description"),
				icon: getOptionalString(formData, "icon") ?? "fa-check",
				is_active: formData.get("is_active") === "on",
			})
			.eq("id", id);

		assertMutationSucceeded("home_objectives", error);
		revalidateObjectivePaths();
		return { status: "success" };
	} catch (error) {
		return toActionError(error);
	}
}

export async function deleteHomeObjective(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("home_objectives")
		.delete()
		.eq("id", id);

	assertMutationSucceeded("home_objectives", error);
	revalidateObjectivePaths();
}

export async function toggleHomeObjective(formData: FormData) {
	await requireAdmin();

	const id = getRequiredString(formData, "id");
	const isActive = getCheckboxBoolean(formData, "is_active");

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("home_objectives")
		.update({ is_active: isActive })
		.eq("id", id);

	assertMutationSucceeded("home_objectives", error);
	revalidateObjectivePaths();
}

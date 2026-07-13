import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createFormData,
	createRequiredSiteSettingsRows,
	createSupabaseClientMock,
} from "@/test/supabase-test-helpers";

const actionMocks = vi.hoisted(() => ({
	createAdminClient: vi.fn(),
	requireAdmin: vi.fn(),
	revalidatePath: vi.fn(),
	uploadImage: vi.fn(),
	deleteImage: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
	requireAdmin: actionMocks.requireAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: actionMocks.createAdminClient,
}));

vi.mock("@/lib/supabase/storage", () => ({
	uploadImage: actionMocks.uploadImage,
	deleteImage: actionMocks.deleteImage,
}));

vi.mock("next/cache", () => ({
	revalidatePath: actionMocks.revalidatePath,
}));

import {
	createActivity,
	createGalleryItem,
	createProfessional,
	deleteActivity,
	deleteGalleryItem,
	deleteInterviewRequest,
	deleteProfessional,
	getAdminActivities,
	getAdminGalleryItems,
	getAdminInterviewRequests,
	getAdminSiteSettings,
	getAdminProfessionals,
	getAdminObjectives,
	createHomeObjective,
	updateHomeObjective,
	deleteHomeObjective,
	toggleHomeObjective,
	reorderRecords,
	toggleActivity,
	toggleGalleryItem,
	updateActivity,
	updateInterviewRequestCrm,
	updateGalleryItem,
	updateSiteSetting,
	updateProfessional,
	type ActionResult,
} from "./admin";

const IDLE_STATE: ActionResult = { status: "idle" };

function createProfessionalFormData() {
	return createFormData({
		first_name: "Ada",
		last_name: "Lovelace",
		role: "Terapeuta",
		bio: "Bio",
		image_url: "/ada.jpg",
		order_index: 2,
	});
}

function createActivityFormData(
	values: Record<string, string | number | null> = {},
) {
	return createFormData({
		title: "Taller de arte",
		description: "Actividad expresiva semanal",
		category: "Talleres",
		icon: "music",
		image_url: "/arte.jpg",
		schedule_info: "Lunes 10 h",
		order_index: 2,
		is_active: "on",
		...values,
	});
}

function createGalleryItemFormData(
	values: Record<string, string | number | null> = {},
) {
	return createFormData({
		title: "Patio central",
		category: "Espacios",
		image_url: "/patio.jpg",
		order_index: 1,
		is_active: "on",
		...values,
	});
}

function createInterviewCrmFormData(
	values: Record<string, string | number | null> = {},
) {
	return createFormData({
		id: "interview-id",
		status: "CONTACTED",
		notes: "Se llamó y quedó pendiente confirmar horario.",
		...values,
	});
}

describe("admin actions", () => {
	beforeEach(() => {
		actionMocks.createAdminClient.mockReset();
		actionMocks.requireAdmin.mockReset();
		actionMocks.revalidatePath.mockReset();
		actionMocks.uploadImage.mockReset();
		actionMocks.deleteImage.mockReset();
		actionMocks.requireAdmin.mockResolvedValue({
			id: "admin-user",
			email: "admin@example.com",
		});
	});

	it("authenticates and uses the admin Supabase client before reading professionals", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "professionals",
				response: { data: [], error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminProfessionals()).resolves.toEqual([]);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("professionals");
	});

	it("authenticates and uses the admin Supabase client before reading home objectives", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "home_objectives",
				response: { data: [], error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminObjectives()).resolves.toEqual([]);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("home_objectives");
	});

	it("does not create a Supabase admin client when admin auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			createProfessional(IDLE_STATE, createProfessionalFormData()),
		).resolves.toEqual({ status: "error", message: "No autorizado" });

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("reads admin site settings after admin auth", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "site_settings",
				response: { data: createRequiredSiteSettingsRows(), error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminSiteSettings()).resolves.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					key: "about_text",
					displayValue: "db-about_text",
				}),
			]),
		);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("site_settings");
	});

	it("reads admin activities after admin auth with admin ordering", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "activities",
				response: { data: [], error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminActivities()).resolves.toEqual([]);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("activities");
		expect(queries[0].select).toHaveBeenCalledWith(
			"id, title, description, category, icon, image_url, schedule_info, is_active, order_index",
		);
		expect(queries[0].order).toHaveBeenCalledWith("order_index", {
			ascending: true,
		});
	});

	it("reads admin gallery items after admin auth with admin ordering", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: [], error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminGalleryItems()).resolves.toEqual([]);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("gallery_items");
		expect(queries[0].order).toHaveBeenCalledWith("order_index", {
			ascending: true,
		});
	});

	it("reads admin interview requests after admin auth ordered by newest and optional status", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "interview_requests",
				response: { data: [], error: null },
			},
			{
				table: "interview_requests",
				response: { data: [], error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminInterviewRequests()).resolves.toEqual([]);
		await expect(getAdminInterviewRequests("CONTACTED")).resolves.toEqual([]);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(2);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(2);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(client.from).toHaveBeenCalledWith("interview_requests");
		expect(queries[0].select).toHaveBeenCalledWith(
			"id, contact_name, patient_name, phone, email, message, status, notes, created_at",
		);
		expect(queries[0].order).toHaveBeenCalledWith("created_at", {
			ascending: false,
		});
		expect(queries[0].eq).not.toHaveBeenCalled();
		expect(queries[1].eq).toHaveBeenCalledWith("status", "CONTACTED");
	});

	it("updates site settings through the admin client and revalidates settings paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "site_settings",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateSiteSetting(
				IDLE_STATE,
				createFormData({
					setting_key: "about_requirements_items",
					setting_type: "JSON",
					setting_value: JSON.stringify(["DNI", "Certificado"]),
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({
				setting_group: "ABOUT",
				setting_type: "JSON",
				setting_value: JSON.stringify(["DNI", "Certificado"]),
			}),
		);
		expect(queries[0].eq).toHaveBeenCalledWith(
			"setting_key",
			"about_requirements_items",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/configuracion",
		);
	});

	// Contract change (PR3): updateSiteSetting is now a useActionState action —
	// (prevState, formData) => Promise<ActionResult>. Errors are returned in-band
	// as { status: "error", message } instead of thrown, so the config-page client
	// island can surface them inline without an error boundary. These four cases
	// assert the returned error shape rather than a rejection.
	it("does not create a Supabase admin client when settings auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			updateSiteSetting(
				IDLE_STATE,
				createFormData({
					setting_key: "about_text",
					setting_type: "RICHTEXT",
					setting_value: "Texto",
				}),
			),
		).resolves.toEqual({ status: "error", message: "No autorizado" });

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("returns an error for malformed JSON setting updates before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				IDLE_STATE,
				createFormData({
					setting_key: "about_requirements_items",
					setting_type: "JSON",
					setting_value: "{broken-json",
				}),
			),
		).resolves.toEqual({
			status: "error",
			message: "Malformed JSON site setting: about_requirements_items",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("returns an error for unknown site setting keys before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				IDLE_STATE,
				createFormData({
					setting_key: "unknown_public_label",
					setting_type: "TEXT",
					setting_value: "Texto",
				}),
			),
		).resolves.toEqual({
			status: "error",
			message: "Configuración desconocida: unknown_public_label",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("returns an error for site setting type mismatches before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				IDLE_STATE,
				createFormData({
					setting_key: "about_text",
					setting_type: "TEXT",
					setting_value: "Texto",
				}),
			),
		).resolves.toEqual({
			status: "error",
			message: "Tipo inválido para about_text",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("creates professionals through the admin client and revalidates affected paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "professionals",
				response: { data: { order_index: 4 }, error: null },
			},
			{
				table: "professionals",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createProfessional(IDLE_STATE, createProfessionalFormData()),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(queries[0].select).toHaveBeenCalledWith("order_index");
		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				first_name: "Ada",
				last_name: "Lovelace",
				image_url: "/ada.jpg",
				order_index: 5,
			}),
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/profesionales",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("updates professionals through the admin client and revalidates affected paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "professionals",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateProfessional(
				IDLE_STATE,
				createFormData({
					id: "professional-id",
					first_name: "Grace",
					last_name: "Hopper",
					role: "Coordinadora",
					bio: null,
					image_url: null,
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ first_name: "Grace", is_active: false }),
		);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ order_index: expect.anything() }),
		);
		expect(queries[0].eq).toHaveBeenCalledWith("id", "professional-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/profesionales",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("deletes professionals through the admin client and revalidates affected paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "professionals",
				response: { data: { image_url: "/profile.jpg" }, error: null },
			},
			{
				table: "professionals",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await deleteProfessional(createFormData({ id: "professional-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(queries[0].select).toHaveBeenCalledWith("image_url");
		expect(queries[1].delete).toHaveBeenCalledTimes(1);
		expect(queries[1].eq).toHaveBeenCalledWith("id", "professional-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/profesionales",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("creates activities through the admin client and revalidates public, admin, and dashboard paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "activities",
				response: { data: { order_index: 1 }, error: null },
			},
			{
				table: "activities",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createActivity(IDLE_STATE, createActivityFormData()),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].select).toHaveBeenCalledWith("order_index");
		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Taller de arte",
				description: "Actividad expresiva semanal",
				icon: "music",
				is_active: true,
				order_index: 2,
			}),
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/actividades",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
	});

	it("defaults unsupported activity icons to heart before creating", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "activities",
				response: { data: null, error: null },
			},
			{
				table: "activities",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await createActivity(IDLE_STATE, createActivityFormData({ icon: "<script>" }));

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ icon: "heart" }),
		);
	});

	it("updates, toggles, and deletes activities through the admin client", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
			{ table: "activities", response: { data: null, error: null } },
			{
				table: "activities",
				response: { data: { image_url: "/activity.jpg" }, error: null },
			},
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateActivity(
				IDLE_STATE,
				createActivityFormData({
					id: "activity-id",
					icon: "pencil",
					is_active: null,
				}),
			),
		).resolves.toEqual({ status: "success" });
		await toggleActivity(
			createFormData({ id: "activity-id", is_active: "true" }),
		);
		await deleteActivity(createFormData({ id: "activity-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(3);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(3);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Taller de arte",
				icon: "pencil",
				is_active: false,
			}),
		);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ order_index: expect.anything() }),
		);
		expect(queries[1].update).toHaveBeenCalledWith({ is_active: true });
		expect(queries[2].select).toHaveBeenCalledWith("image_url");
		expect(queries[3].delete).toHaveBeenCalledTimes(1);
		expect(queries[3].eq).toHaveBeenCalledWith("id", "activity-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/actividades",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("defaults unsupported activity icons to heart before updating", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await updateActivity(
			IDLE_STATE,
			createActivityFormData({
				id: "activity-id",
				icon: "unknown",
				is_active: null,
			}),
		);

		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ icon: "heart" }),
		);
	});

	it("preserves the stored activity image_url when no image is provided on update", async () => {
		// Regression (FIX 1): the activities form has no image input, so neither
		// image_file nor existing_image_url reaches updateActivity. The payload
		// must OMIT image_url so the stored value is preserved rather than nulled.
		const { client, queries } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateActivity(
				IDLE_STATE,
				createFormData({
					id: "activity-id",
					title: "Taller de arte",
					description: "Actividad expresiva semanal",
					category: "Talleres",
					icon: "music",
					is_active: "on",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.uploadImage).not.toHaveBeenCalled();
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ image_url: expect.anything() }),
		);
	});

	it("starts order_index at 0 when creating into an empty table", async () => {
		// Covers the empty-table branch of getNextOrderIndex: maybeSingle returns
		// data: null, so the first row must land at order_index 0 ((null ?? -1) + 1).
		const { client, queries } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createActivity(IDLE_STATE, createActivityFormData()),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ order_index: 0 }),
		);
	});

	it("rejects invalid activity payloads before mutating", async () => {
		const { client } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createActivity(IDLE_STATE, createActivityFormData({ title: "" })),
		).resolves.toEqual({
			status: "error",
			message: "El campo title es obligatorio",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("returns an error result when activity auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			createActivity(IDLE_STATE, createActivityFormData()),
		).resolves.toEqual({ status: "error", message: "No autorizado" });

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("creates gallery items through the admin client and revalidates public and gallery paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: { order_index: 2 }, error: null },
			},
			{
				table: "gallery_items",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryItem(IDLE_STATE, createGalleryItemFormData()),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].select).toHaveBeenCalledWith("order_index");
		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Patio central",
				image_url: "/patio.jpg",
				is_active: true,
				order_index: 3,
			}),
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith(
			"/admin/dashboard",
		);
	});

	it("updates, toggles, and deletes gallery items through the admin client", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_items", response: { data: null, error: null } },
			{
				table: "gallery_items",
				response: { data: { image_url: "/gallery.jpg" }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({ id: "gallery-id", is_active: null }),
			),
		).resolves.toEqual({ status: "success" });
		await toggleGalleryItem(
			createFormData({ id: "gallery-id", is_active: "true" }),
		);
		await deleteGalleryItem(createFormData({ id: "gallery-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(3);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(3);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Patio central", is_active: false }),
		);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ order_index: expect.anything() }),
		);
		expect(queries[1].update).toHaveBeenCalledWith({ is_active: true });
		expect(queries[2].select).toHaveBeenCalledWith("image_url");
		expect(queries[3].delete).toHaveBeenCalledTimes(1);
		expect(queries[3].eq).toHaveBeenCalledWith("id", "gallery-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith(
			"/admin/dashboard",
		);
	});

	it("returns an error result for invalid gallery payloads before creating the admin client", async () => {
		await expect(
			createGalleryItem(IDLE_STATE, createGalleryItemFormData({ image_url: "" })),
		).resolves.toEqual({
			status: "error",
			message: "El campo image_url es obligatorio",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("returns an error result when gallery auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			createGalleryItem(IDLE_STATE, createGalleryItemFormData()),
		).resolves.toEqual({ status: "error", message: "No autorizado" });

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("updates only interview CRM fields and revalidates CRM admin paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "interview_requests",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateInterviewRequestCrm(
				IDLE_STATE,
				createInterviewCrmFormData({
					contact_name: "No debe cambiar",
					patient_name: "Tampoco debe cambiar",
					phone: "1111",
					email: "otro@example.com",
					message: "Mensaje original alterado",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].update).toHaveBeenCalledWith({
			status: "CONTACTED",
			notes: "Se llamó y quedó pendiente confirmar horario.",
		});
		expect(queries[0].update).not.toHaveBeenCalledWith(
			expect.objectContaining({ contact_name: expect.anything() }),
		);
		expect(queries[0].eq).toHaveBeenCalledWith("id", "interview-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/entrevistas",
		);
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith("/");
	});

	it("returns an error result for invalid interview CRM payloads before creating the admin client", async () => {
		await expect(
			updateInterviewRequestCrm(
				IDLE_STATE,
				createInterviewCrmFormData({ status: "ARCHIVED" }),
			),
		).resolves.toEqual({
			status: "error",
			message: "Estado de entrevista inválido: ARCHIVED",
		});

		await expect(
			updateInterviewRequestCrm(
				IDLE_STATE,
				createInterviewCrmFormData({ notes: "x".repeat(2001) }),
			),
		).resolves.toEqual({
			status: "error",
			message: "Las notas internas no pueden superar 2000 caracteres",
		});

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(2);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("does not create a Supabase admin client when interview CRM auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			updateInterviewRequestCrm(IDLE_STATE, createInterviewCrmFormData()),
		).resolves.toEqual({ status: "error", message: "No autorizado" });

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("deletes an interview request and revalidates CRM admin paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "interview_requests",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await deleteInterviewRequest(createFormData({ id: "interview-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].delete).toHaveBeenCalledTimes(1);
		expect(queries[0].eq).toHaveBeenCalledWith("id", "interview-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/entrevistas",
		);
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith("/");
	});

	it("rejects interview deletions without an id before creating the admin client", async () => {
		await expect(deleteInterviewRequest(createFormData({}))).rejects.toThrow(
			"El campo id es obligatorio",
		);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("does not create a Supabase admin client when interview deletion auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			deleteInterviewRequest(createFormData({ id: "interview-id" })),
		).rejects.toThrow("No autorizado");

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	describe("Storage Upload and CRUD integrations", () => {
		it("uploads a file on professional create and saves public URL", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "professionals", response: { data: null, error: null } },
				{ table: "professionals", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);
			actionMocks.uploadImage.mockResolvedValue(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
			);

			const formData = createProfessionalFormData();
			const dummyFile = new File(["foo"], "image.png", { type: "image/png" });
			formData.set("image_file", dummyFile);

			await createProfessional(IDLE_STATE, formData);

			expect(actionMocks.uploadImage).toHaveBeenCalledWith(
				dummyFile,
				"professionals",
			);
			expect(queries[1].insert).toHaveBeenCalledWith(
				expect.objectContaining({
					image_url:
						"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
				}),
			);
		});

		it("removes uploaded file if DB INSERT fails during create", async () => {
			const { client } = createSupabaseClientMock([
				{ table: "professionals", response: { data: null, error: null } },
				{
					table: "professionals",
					response: { data: null, error: { message: "Database write error" } },
				},
			]);
			actionMocks.createAdminClient.mockReturnValue(client);
			actionMocks.uploadImage.mockResolvedValue(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
			);

			const formData = createProfessionalFormData();
			const dummyFile = new File(["foo"], "image.png", { type: "image/png" });
			formData.set("image_file", dummyFile);

			// Infra/DB failures are now masked behind a generic message so we don't
			// leak the table name + Postgres detail to the client (the detailed
			// error is logged server-side via console.error instead).
			await expect(createProfessional(IDLE_STATE, formData)).resolves.toEqual({
				status: "error",
				message: "No se pudo guardar. Intentá nuevamente.",
			});

			expect(actionMocks.uploadImage).toHaveBeenCalledWith(
				dummyFile,
				"professionals",
			);
			expect(actionMocks.deleteImage).toHaveBeenCalledWith(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
			);
		});

		it("uploads file and deletes existing image on professional update", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "professionals", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);
			actionMocks.uploadImage.mockResolvedValue(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-new.png",
			);

			const formData = createFormData({
				id: "professional-id",
				first_name: "Ada",
				last_name: "Lovelace",
				role: "Terapeuta",
				existing_image_url:
					"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-old.png",
			});
			const dummyFile = new File(["foo"], "image.png", { type: "image/png" });
			formData.set("image_file", dummyFile);

			await updateProfessional(IDLE_STATE, formData);

			expect(actionMocks.uploadImage).toHaveBeenCalledWith(
				dummyFile,
				"professionals",
			);
			expect(queries[0].update).toHaveBeenCalledWith(
				expect.objectContaining({
					image_url:
						"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-new.png",
				}),
			);
			expect(actionMocks.deleteImage).toHaveBeenCalledWith(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-old.png",
			);
		});
	});

	describe("Home Objectives Actions", () => {
		it("creates a home objective successfully and revalidates", async () => {
			const { client, queries } = createSupabaseClientMock([
				{
					table: "home_objectives",
					response: { data: { order_index: 6 }, error: null },
				},
				{ table: "home_objectives", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			const formData = createFormData({
				title: "Nuevo Objetivo",
				description: "Descripción detallada",
				icon: "fa-star",
			});

			await expect(createHomeObjective(IDLE_STATE, formData)).resolves.toEqual({
				status: "success",
			});

			expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
			expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
			expect(queries[0].select).toHaveBeenCalledWith("order_index");
			expect(queries[1].insert).toHaveBeenCalledWith({
				title: "Nuevo Objetivo",
				description: "Descripción detallada",
				icon: "fa-star",
				is_active: true,
				order_index: 7,
			});
			expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
				"/admin/dashboard",
			);
			expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
				"/admin/objetivos",
			);
			expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		});

		it("updates an existing home objective without touching order_index", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "home_objectives", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			const formData = createFormData({
				id: "objective-id",
				title: "Objetivo Editado",
				description: "Nueva descripción",
				icon: "fa-check",
				is_active: "on",
			});

			await expect(updateHomeObjective(IDLE_STATE, formData)).resolves.toEqual({
				status: "success",
			});

			expect(queries[0].update).toHaveBeenCalledWith({
				title: "Objetivo Editado",
				description: "Nueva descripción",
				icon: "fa-check",
				is_active: true,
			});
			expect(queries[0].eq).toHaveBeenCalledWith("id", "objective-id");
		});

		it("deletes a home objective and revalidates", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "home_objectives", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await deleteHomeObjective(createFormData({ id: "objective-id" }));

			expect(queries[0].delete).toHaveBeenCalledTimes(1);
			expect(queries[0].eq).toHaveBeenCalledWith("id", "objective-id");
		});

		it("toggles is_active on home objectives", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "home_objectives", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await toggleHomeObjective(
				createFormData({ id: "objective-id", is_active: "true" }),
			);

			expect(queries[0].update).toHaveBeenCalledWith({ is_active: true });
		});

	});

	describe("reorderRecords", () => {
		it("persists array position as order_index for each id and revalidates", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "activities", response: { data: null, error: null } },
				{ table: "activities", response: { data: null, error: null } },
				{ table: "activities", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await reorderRecords("activities", ["id-a", "id-b", "id-c"]);

			expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
			expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
			expect(queries[0].update).toHaveBeenCalledWith({ order_index: 0 });
			expect(queries[0].eq).toHaveBeenCalledWith("id", "id-a");
			expect(queries[1].update).toHaveBeenCalledWith({ order_index: 1 });
			expect(queries[1].eq).toHaveBeenCalledWith("id", "id-b");
			expect(queries[2].update).toHaveBeenCalledWith({ order_index: 2 });
			expect(queries[2].eq).toHaveBeenCalledWith("id", "id-c");
			expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
				"/admin/actividades",
			);
			expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		});

		it("revalidates the matching paths for each reorderable table", async () => {
			const { client } = createSupabaseClientMock([
				{ table: "gallery_items", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await reorderRecords("gallery_items", ["only-id"]);

			expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
			expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith(
				"/admin/dashboard",
			);
		});

		it("authenticates before touching the admin client and skips empty payloads", async () => {
			await reorderRecords("home_objectives", []);

			expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
			expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
			expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
		});

		it("does not reach the admin client when reorder auth fails", async () => {
			actionMocks.requireAdmin.mockRejectedValueOnce(
				new Error("No autorizado"),
			);

			await expect(
				reorderRecords("professionals", ["id-a"]),
			).rejects.toThrow("No autorizado");

			expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
			expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
		});
	});
});

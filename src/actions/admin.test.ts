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
	deleteImages: vi.fn(),
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
	deleteImages: actionMocks.deleteImages,
}));

vi.mock("next/cache", () => ({
	revalidatePath: actionMocks.revalidatePath,
}));

import {
	createActivity,
	createGalleryCategory,
	createGalleryItem,
	createProfessional,
	deleteActivity,
	deleteGalleryCategory,
	deleteGalleryItem,
	getAdminGalleryCategories,
	setGalleryCategoryActive,
	updateGalleryCategory,
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
		actionMocks.deleteImages.mockReset();
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

	it("reads admin gallery items newest first, mirroring the public ordering", async () => {
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
		// A scalar read of the binding, with no embedded category: the categories
		// arrive as their own list, and joining here would fetch the same handful of
		// names once per photo.
		//
		// `hidden_by_category` is on the admin shape only. The public read filters
		// `is_active = true`, so a marked row never reaches it.
		expect(queries[0].select).toHaveBeenCalledWith(
			"id, title, category, category_id, image_url, is_active, hidden_by_category, order_index",
		);
		expect(queries[0].order).toHaveBeenCalledWith("order_index", {
			ascending: false,
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

	it("stores the encoded image dimensions the browser reports on create", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: { order_index: 2 }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({ image_width: 2048, image_height: 1536 }),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ width: 2048, height: 1536 }),
		);
	});

	// An animated GIF skips the browser re-encode, so it arrives with no
	// dimensions. The row still has to be created; the public grid falls back to
	// its nominal box for it.
	it("creates a gallery item with null dimensions when the browser sent none", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: { order_index: 2 }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryItem(IDLE_STATE, createGalleryItemFormData()),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ width: null, height: null }),
		);
	});

	// Editing only the title must not touch the stored dimensions: the image is
	// unchanged, and nulling them would reintroduce the layout shift for that row.
	it("leaves stored dimensions alone when an update carries no new image", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({ id: "gallery-id" }),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ width: expect.anything() }),
		);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ height: expect.anything() }),
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
		// Activating a photo by hand clears the cascade marker in the same write,
		// so a later category reactivation no longer treats it as one of its own.
		expect(queries[1].update).toHaveBeenCalledWith({
			is_active: true,
			hidden_by_category: false,
		});
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

	// ── Gallery categories ────────────────────────────────────────────────────
	//
	// Every cascade below is asserted as an ORDER of writes, not only as a set.
	// The mock's `from` is strictly sequential and throws when the table it is
	// handed does not match the next declared query, so the declaration order in
	// each `createSupabaseClientMock([...])` call IS the assertion that the
	// writer touched the tables in that order.

	it("reads every category, active and inactive, ordered by order_index", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_categories", response: { data: [], error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(getAdminGalleryCategories()).resolves.toEqual([]);

		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].select).toHaveBeenCalledWith(
			"id, name, is_active, order_index",
		);
		expect(queries[0].order).toHaveBeenCalledWith("order_index", {
			ascending: true,
		});
		// No is_active filter: the admin manages inactive categories too, and one
		// that could not be read could never be reactivated.
		expect(queries[0].eq).not.toHaveBeenCalled();
	});

	it("creates a category at the next order index, active by default", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { order_index: 3 }, error: null },
			},
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryCategory(IDLE_STATE, createFormData({ name: "Deporte" })),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith({
			name: "Deporte",
			is_active: true,
			order_index: 4,
		});
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("creates an inactive category when the switch is off", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { order_index: 0 }, error: null },
			},
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryCategory(
				IDLE_STATE,
				createFormData({ name: "Deporte", is_active: "off" }),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ is_active: false }),
		);
	});

	it("refuses a blank category name before touching the database", async () => {
		await expect(
			createGalleryCategory(IDLE_STATE, createFormData({ name: "   " })),
		).resolves.toEqual({
			status: "error",
			message: "El campo name es obligatorio",
		});

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	// The unique index on lower(name) is the authority; a pre-check SELECT would
	// be racy. The administrator sees Spanish, never the Postgres detail.
	it("reports a duplicate name in Spanish instead of a generic failure", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { order_index: 0 }, error: null },
			},
			{
				table: "gallery_categories",
				response: {
					data: null,
					error: {
						message:
							'duplicate key value violates unique constraint "gallery_categories_name_lower_key"',
						code: "23505",
					},
				},
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryCategory(IDLE_STATE, createFormData({ name: "deporte" })),
		).resolves.toEqual({
			status: "error",
			message: "Ya existe una categoría con ese nombre.",
		});

		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("keeps an unmapped category failure generic", async () => {
		const { client } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { order_index: 0 }, error: null },
			},
			{
				table: "gallery_categories",
				response: {
					data: null,
					error: { message: "column gallery_categories.nombre does not exist" },
				},
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		const result = await createGalleryCategory(
			IDLE_STATE,
			createFormData({ name: "Deporte" }),
		);

		expect(result).toEqual({
			status: "error",
			message: "No se pudo guardar. Intentá nuevamente.",
		});
	});

	it("renames a category without touching its photos", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { is_active: true }, error: null },
			},
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryCategory(
				IDLE_STATE,
				createFormData({
					id: "category-deporte",
					name: "Actividades Deportivas",
					is_active: "on",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].update).toHaveBeenCalledWith({
			name: "Actividades Deportivas",
			is_active: true,
		});
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
	});

	// D7: the modal switch is a second door to the same inactive→active
	// transition the chip toggle offers, so it runs the same restore.
	it("restores cascade-hidden photos when the modal switch reactivates a category", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { is_active: false }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryCategory(
				IDLE_STATE,
				createFormData({
					id: "category-deporte",
					name: "Deporte",
					is_active: "on",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].update).toHaveBeenCalledWith({
			is_active: true,
			hidden_by_category: false,
		});
		expect(queries[1].eq).toHaveBeenCalledWith(
			"category_id",
			"category-deporte",
		);
		// The marker is the whole predicate: a photo hidden by hand carries none
		// and is therefore never republished.
		expect(queries[1].eq).toHaveBeenCalledWith("hidden_by_category", true);
		expect(queries[1].update.mock.invocationCallOrder[0]).toBeLessThan(
			queries[2].update.mock.invocationCallOrder[0],
		);
	});

	// Deactivating through the modal is keep semantics on purpose: hiding photos
	// is destructive enough to require the warning dialog, which is a different
	// entry point.
	it("does not hide any photo when the modal switch deactivates a category", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { is_active: true }, error: null },
			},
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryCategory(
				IDLE_STATE,
				createFormData({ id: "category-deporte", name: "Deporte" }),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].update).toHaveBeenCalledWith({
			name: "Deporte",
			is_active: false,
		});
		expect(client.from).not.toHaveBeenCalledWith("gallery_items");
	});

	it("reports a category deleted in another tab instead of writing nothing", async () => {
		const { client } = createSupabaseClientMock([
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryCategory(
				IDLE_STATE,
				createFormData({ id: "category-gone", name: "Deporte" }),
			),
		).resolves.toEqual({
			status: "error",
			message: "La categoría seleccionada ya no existe. Actualizá la página.",
		});

		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	// Category first, then the items: failing in between leaves exactly the
	// documented deactivate+keep state, which a retry converges out of.
	it("deactivates a category before hiding its photos, and marks only the visible ones", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_categories", response: { data: null, error: null } },
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await setGalleryCategoryActive(
			createFormData({ id: "category-deporte", mode: "purge" }),
		);

		expect(queries[0].update).toHaveBeenCalledWith({ is_active: false });
		expect(queries[1].update).toHaveBeenCalledWith({
			is_active: false,
			hidden_by_category: true,
		});
		expect(queries[1].eq).toHaveBeenCalledWith(
			"category_id",
			"category-deporte",
		);
		// The marker invariant. A photo the administrator already hid by hand is
		// skipped here, so it never acquires a marker and reactivation never
		// republishes it.
		expect(queries[1].eq).toHaveBeenCalledWith("is_active", true);
		expect(queries[0].update.mock.invocationCallOrder[0]).toBeLessThan(
			queries[1].update.mock.invocationCallOrder[0],
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
	});

	it("leaves every photo alone when a category is deactivated with keep", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await setGalleryCategoryActive(
			createFormData({ id: "category-deporte", mode: "keep" }),
		);

		expect(queries[0].update).toHaveBeenCalledWith({ is_active: false });
		expect(client.from).not.toHaveBeenCalledWith("gallery_items");
	});

	// Items first, then the category: failing in between shows the restored
	// photos under the catch-all chip only, which deactivate+keep already
	// produces, and re-running converges.
	it("restores photos before reactivating the category, asking for no mode", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await setGalleryCategoryActive(
			createFormData({ id: "category-deporte", is_active: "on" }),
		);

		expect(queries[0].update).toHaveBeenCalledWith({
			is_active: true,
			hidden_by_category: false,
		});
		expect(queries[0].eq).toHaveBeenCalledWith("hidden_by_category", true);
		expect(queries[1].update).toHaveBeenCalledWith({ is_active: true });
		expect(queries[0].update.mock.invocationCallOrder[0]).toBeLessThan(
			queries[1].update.mock.invocationCallOrder[0],
		);
	});

	// An unrecognised choice must fail rather than fall back to a default that
	// silently keeps or silently deletes.
	it.each([
		["missing", null],
		["unrecognised", "borrar-todo"],
	])("refuses a %s cascade mode", async (_case, mode) => {
		await expect(
			setGalleryCategoryActive(
				createFormData({ id: "category-deporte", mode }),
			),
		).rejects.toThrow("Modo de cascada inválido");

		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("unbinds photos before deleting a category with keep, leaving their legacy text", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await deleteGalleryCategory(
			createFormData({ id: "category-deporte", mode: "keep" }),
		);

		// category_id only. The legacy text is the caption the public gallery
		// renders, and an unbound photo has nothing else to show.
		expect(queries[0].update).toHaveBeenCalledWith({ category_id: null });
		expect(queries[0].eq).toHaveBeenCalledWith(
			"category_id",
			"category-deporte",
		);
		expect(queries[1].delete).toHaveBeenCalledTimes(1);
		expect(queries[1].eq).toHaveBeenCalledWith("id", "category-deporte");
		expect(queries[0].update.mock.invocationCallOrder[0]).toBeLessThan(
			queries[1].delete.mock.invocationCallOrder[0],
		);
		expect(actionMocks.deleteImages).not.toHaveBeenCalled();
	});

	// D5: rows die before their Storage objects. A leaked object is invisible; a
	// surviving row pointing at a deleted object is a broken image on the public
	// site.
	it("deletes photo rows and the category before removing any stored object", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: {
					data: [{ image_url: "/one.jpg" }, { image_url: "/two.jpg" }],
					error: null,
				},
			},
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_categories", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await deleteGalleryCategory(
			createFormData({ id: "category-deporte", mode: "purge" }),
		);

		expect(queries[0].select).toHaveBeenCalledWith("id, image_url");
		expect(queries[1].delete).toHaveBeenCalledTimes(1);
		expect(queries[2].delete).toHaveBeenCalledTimes(1);
		expect(actionMocks.deleteImages).toHaveBeenCalledWith([
			"/one.jpg",
			"/two.jpg",
		]);
		expect(queries[2].delete.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.deleteImages.mock.invocationCallOrder[0],
		);
	});

	// The item reference is ON DELETE RESTRICT, so a category still bound to a
	// photo — a row rebound in another tab after the unbind ran, say — refuses to
	// delete. The action must fail loudly rather than report success and
	// revalidate a page whose state did not change.
	it("fails loudly when a bound photo makes the category delete restrict", async () => {
		const { client } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
			{
				table: "gallery_categories",
				response: {
					data: null,
					error: {
						message:
							'update or delete on table "gallery_categories" violates foreign key constraint "gallery_items_category_id_fkey" on table "gallery_items"',
						code: "23503",
					},
				},
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			deleteGalleryCategory(
				createFormData({ id: "category-deporte", mode: "keep" }),
			),
		).rejects.toThrow("mutation failed for gallery_categories");

		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	// D8: the server derives the legacy text from the picked id. A client that
	// submitted a name could make the two columns disagree.
	it("derives an item's legacy category text from the picked category id", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { name: "Deporte" }, error: null },
			},
			{
				table: "gallery_items",
				response: { data: { order_index: 2 }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({
					category: null,
					category_id: "category-deporte",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[0].select).toHaveBeenCalledWith("name");
		expect(queries[0].eq).toHaveBeenCalledWith("id", "category-deporte");
		expect(queries[2].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				category_id: "category-deporte",
				category: "Deporte",
			}),
		);
	});

	it("stores no binding and no text when no category is selected", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: { order_index: 2 }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			createGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({ category: null, category_id: "" }),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].insert).toHaveBeenCalledWith(
			expect.objectContaining({ category_id: null, category: null }),
		);
	});

	it.each([
		["create", createGalleryItem],
		["update", updateGalleryItem],
	])(
		"refuses to %s an item against a category that no longer exists",
		async (_case, action) => {
			const { client } = createSupabaseClientMock([
				{ table: "gallery_categories", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await expect(
				action(
					IDLE_STATE,
					createGalleryItemFormData({
						id: "gallery-id",
						category: null,
						category_id: "category-gone",
					}),
				),
			).resolves.toEqual({
				status: "error",
				message: "La categoría seleccionada ya no existe. Actualizá la página.",
			});

			expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
		},
	);

	it("clears the cascade marker when an item update makes the photo visible", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { name: "Deporte" }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({
					id: "gallery-id",
					category: null,
					category_id: "category-deporte",
					is_active: "on",
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].update).toHaveBeenCalledWith(
			expect.objectContaining({ is_active: true, hidden_by_category: false }),
		);
	});

	// Hiding a photo by hand must NOT write the marker: the marker means "hidden
	// by a category cascade", and only that cascade may set it.
	it("does not write the marker when an item update hides the photo", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_categories",
				response: { data: { name: "Deporte" }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await expect(
			updateGalleryItem(
				IDLE_STATE,
				createGalleryItemFormData({
					id: "gallery-id",
					category: null,
					category_id: "category-deporte",
					is_active: null,
				}),
			),
		).resolves.toEqual({ status: "success" });

		expect(queries[1].update).toHaveBeenCalledWith(
			expect.not.objectContaining({ hidden_by_category: expect.anything() }),
		);
	});

	it("does not write the marker when a toggle hides the photo", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await toggleGalleryItem(createFormData({ id: "gallery-id" }));

		expect(queries[0].update).toHaveBeenCalledWith({ is_active: false });
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
		it("persists array position as order_index for an ascending listing and revalidates", async () => {
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

		it("mirrors array position into order_index for a descending listing", async () => {
			// getAdminGalleryItems reads order_index DESC, so the visually first id
			// must receive the HIGHEST index. Assigning the raw array position here
			// inverted the whole gallery on every drag.
			const { client, queries } = createSupabaseClientMock([
				{ table: "gallery_items", response: { data: null, error: null } },
				{ table: "gallery_items", response: { data: null, error: null } },
				{ table: "gallery_items", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);

			await reorderRecords("gallery_items", ["top-id", "middle-id", "bottom-id"]);

			expect(queries[0].update).toHaveBeenCalledWith({ order_index: 2 });
			expect(queries[0].eq).toHaveBeenCalledWith("id", "top-id");
			expect(queries[1].update).toHaveBeenCalledWith({ order_index: 1 });
			expect(queries[1].eq).toHaveBeenCalledWith("id", "middle-id");
			expect(queries[2].update).toHaveBeenCalledWith({ order_index: 0 });
			expect(queries[2].eq).toHaveBeenCalledWith("id", "bottom-id");
		});

		it("keeps a dragged pair adjacent when the listing is descending", async () => {
			// Regression guard for the reported symptom: swapping two neighbours
			// used to come back with the entire list reversed, so the swap looked
			// undone. A round-trip through the DESC read must reproduce the input.
			const ids = ["a", "b", "c", "d"];
			const { client, queries } = createSupabaseClientMock(
				ids.map(() => ({
					table: "gallery_items" as const,
					response: { data: null, error: null },
				})),
			);
			actionMocks.createAdminClient.mockReturnValue(client);

			await reorderRecords("gallery_items", ids);

			const persisted = ids.map((id, index) => ({
				id,
				order_index: (
					queries[index].update.mock.calls[0][0] as { order_index: number }
				).order_index,
			}));
			const readBackDescending = [...persisted]
				.sort((left, right) => right.order_index - left.order_index)
				.map((row) => row.id);

			expect(readBackDescending).toEqual(ids);
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

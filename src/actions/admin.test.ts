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
	deleteProfessional,
	getAdminActivities,
	getAdminGalleryItems,
	getAdminInterviewRequests,
	getAdminSiteSettings,
	getAdminProfessionals,
	toggleActivity,
	toggleGalleryItem,
	updateActivity,
	updateActivityOrder,
	updateInterviewRequestCrm,
	updateGalleryItem,
	updateGalleryItemOrder,
	updateSiteSetting,
	updateProfessional,
} from "./admin";

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

	it("does not create a Supabase admin client when admin auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			createProfessional(createProfessionalFormData()),
		).rejects.toThrow("No autorizado");

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

		await updateSiteSetting(
			createFormData({
				setting_key: "about_requirements_items",
				setting_type: "JSON",
				setting_value: JSON.stringify(["DNI", "Certificado"]),
			}),
		);

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

	it("does not create a Supabase admin client when settings auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			updateSiteSetting(
				createFormData({
					setting_key: "about_text",
					setting_type: "RICHTEXT",
					setting_value: "Texto",
				}),
			),
		).rejects.toThrow("No autorizado");

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("rejects malformed JSON setting updates before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				createFormData({
					setting_key: "about_requirements_items",
					setting_type: "JSON",
					setting_value: "{broken-json",
				}),
			),
		).rejects.toThrow("Malformed JSON site setting: about_requirements_items");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("rejects unknown site setting keys before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				createFormData({
					setting_key: "unknown_public_label",
					setting_type: "TEXT",
					setting_value: "Texto",
				}),
			),
		).rejects.toThrow("Configuración desconocida: unknown_public_label");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("rejects site setting type mismatches before mutating or revalidating", async () => {
		await expect(
			updateSiteSetting(
				createFormData({
					setting_key: "about_text",
					setting_type: "TEXT",
					setting_value: "Texto",
				}),
			),
		).rejects.toThrow("Tipo inválido para about_text");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("creates professionals through the admin client and revalidates affected paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "professionals",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await createProfessional(createProfessionalFormData());

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(queries[0].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				first_name: "Ada",
				last_name: "Lovelace",
				image_url: "/ada.jpg",
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

		await updateProfessional(
			createFormData({
				id: "professional-id",
				first_name: "Grace",
				last_name: "Hopper",
				role: "Coordinadora",
				bio: null,
				image_url: null,
				order_index: 3,
			}),
		);

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ first_name: "Grace", is_active: false }),
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
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await createActivity(createActivityFormData());

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Taller de arte",
				description: "Actividad expresiva semanal",
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

	it("updates, toggles, orders, and deletes activities through the admin client", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "activities", response: { data: null, error: null } },
			{ table: "activities", response: { data: null, error: null } },
			{ table: "activities", response: { data: null, error: null } },
			{
				table: "activities",
				response: { data: { image_url: "/activity.jpg" }, error: null },
			},
			{ table: "activities", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await updateActivity(
			createActivityFormData({ id: "activity-id", is_active: null }),
		);
		await toggleActivity(
			createFormData({ id: "activity-id", is_active: "true" }),
		);
		await updateActivityOrder(
			createFormData({ id: "activity-id", order_index: 7 }),
		);
		await deleteActivity(createFormData({ id: "activity-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(4);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(4);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Taller de arte", is_active: false }),
		);
		expect(queries[1].update).toHaveBeenCalledWith({ is_active: true });
		expect(queries[2].update).toHaveBeenCalledWith({ order_index: 7 });
		expect(queries[3].select).toHaveBeenCalledWith("image_url");
		expect(queries[4].delete).toHaveBeenCalledTimes(1);
		expect(queries[4].eq).toHaveBeenCalledWith("id", "activity-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
			"/admin/actividades",
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
	});

	it("rejects invalid activity payloads before creating the admin client", async () => {
		await expect(
			createActivity(createActivityFormData({ title: "" })),
		).rejects.toThrow("El campo title es obligatorio");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("does not create a Supabase admin client when activity auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(createActivity(createActivityFormData())).rejects.toThrow(
			"No autorizado",
		);

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("creates gallery items through the admin client and revalidates public and gallery paths", async () => {
		const { client, queries } = createSupabaseClientMock([
			{
				table: "gallery_items",
				response: { data: null, error: null },
			},
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await createGalleryItem(createGalleryItemFormData());

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1);
		expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
			actionMocks.createAdminClient.mock.invocationCallOrder[0],
		);
		expect(queries[0].insert).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Patio central",
				image_url: "/patio.jpg",
				is_active: true,
			}),
		);
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith(
			"/admin/dashboard",
		);
	});

	it("updates, toggles, orders, and deletes gallery items through the admin client", async () => {
		const { client, queries } = createSupabaseClientMock([
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_items", response: { data: null, error: null } },
			{ table: "gallery_items", response: { data: null, error: null } },
			{
				table: "gallery_items",
				response: { data: { image_url: "/gallery.jpg" }, error: null },
			},
			{ table: "gallery_items", response: { data: null, error: null } },
		]);
		actionMocks.createAdminClient.mockReturnValue(client);

		await updateGalleryItem(
			createGalleryItemFormData({ id: "gallery-id", is_active: null }),
		);
		await toggleGalleryItem(
			createFormData({ id: "gallery-id", is_active: "true" }),
		);
		await updateGalleryItemOrder(
			createFormData({ id: "gallery-id", order_index: 4 }),
		);
		await deleteGalleryItem(createFormData({ id: "gallery-id" }));

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(4);
		expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(4);
		expect(queries[0].update).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Patio central", is_active: false }),
		);
		expect(queries[1].update).toHaveBeenCalledWith({ is_active: true });
		expect(queries[2].update).toHaveBeenCalledWith({ order_index: 4 });
		expect(queries[3].select).toHaveBeenCalledWith("image_url");
		expect(queries[4].delete).toHaveBeenCalledTimes(1);
		expect(queries[4].eq).toHaveBeenCalledWith("id", "gallery-id");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/galeria");
		expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
		expect(actionMocks.revalidatePath).not.toHaveBeenCalledWith(
			"/admin/dashboard",
		);
	});

	it("rejects invalid gallery payloads before creating the admin client", async () => {
		await expect(
			createGalleryItem(createGalleryItemFormData({ image_url: "" })),
		).rejects.toThrow("El campo image_url es obligatorio");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("does not create a Supabase admin client when gallery auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			createGalleryItem(createGalleryItemFormData()),
		).rejects.toThrow("No autorizado");

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

		await updateInterviewRequestCrm(
			createInterviewCrmFormData({
				contact_name: "No debe cambiar",
				patient_name: "Tampoco debe cambiar",
				phone: "1111",
				email: "otro@example.com",
				message: "Mensaje original alterado",
			}),
		);

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

	it("rejects invalid interview CRM payloads before creating the admin client", async () => {
		await expect(
			updateInterviewRequestCrm(
				createInterviewCrmFormData({ status: "ARCHIVED" }),
			),
		).rejects.toThrow("Estado de entrevista inválido: ARCHIVED");

		await expect(
			updateInterviewRequestCrm(
				createInterviewCrmFormData({ notes: "x".repeat(2001) }),
			),
		).rejects.toThrow("Las notas internas no pueden superar 2000 caracteres");

		expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(2);
		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	it("does not create a Supabase admin client when interview CRM auth fails", async () => {
		actionMocks.requireAdmin.mockRejectedValueOnce(new Error("No autorizado"));

		await expect(
			updateInterviewRequestCrm(createInterviewCrmFormData()),
		).rejects.toThrow("No autorizado");

		expect(actionMocks.createAdminClient).not.toHaveBeenCalled();
		expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
	});

	describe("Storage Upload and CRUD integrations", () => {
		it("uploads a file on professional create and saves public URL", async () => {
			const { client, queries } = createSupabaseClientMock([
				{ table: "professionals", response: { data: null, error: null } },
			]);
			actionMocks.createAdminClient.mockReturnValue(client);
			actionMocks.uploadImage.mockResolvedValue(
				"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
			);

			const formData = createProfessionalFormData();
			const dummyFile = new File(["foo"], "image.png", { type: "image/png" });
			formData.set("image_file", dummyFile);

			await createProfessional(formData);

			expect(actionMocks.uploadImage).toHaveBeenCalledWith(
				dummyFile,
				"professionals",
			);
			expect(queries[0].insert).toHaveBeenCalledWith(
				expect.objectContaining({
					image_url:
						"https://supabase.co/storage/v1/object/public/cms-images/professionals/uuid-123.png",
				}),
			);
		});

		it("removes uploaded file if DB INSERT fails during create", async () => {
			const { client } = createSupabaseClientMock([
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

			await expect(createProfessional(formData)).rejects.toThrow(
				"Database write error",
			);

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

			await updateProfessional(formData);

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
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	ensureBucketExists,
	uploadImage,
	deleteImage,
	deleteImages,
} from "./storage";
import {
	MAX_IMAGE_SIZE_BYTES,
	OVERSIZED_IMAGE_MESSAGE,
} from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

describe("Supabase Storage Helpers", () => {
	const mockStorageFrom = vi.fn();
	const mockStorageUpload = vi.fn();
	const mockStorageGetPublicUrl = vi.fn();
	const mockStorageRemove = vi.fn();
	const mockStorageGetBucket = vi.fn();
	const mockStorageCreateBucket = vi.fn();

	const mockSupabaseClient = {
		storage: {
			getBucket: mockStorageGetBucket,
			createBucket: mockStorageCreateBucket,
			from: mockStorageFrom,
		},
	};

	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mockproject.supabase.co");

		vi.mocked(createAdminClient).mockReturnValue(
			mockSupabaseClient as unknown as ReturnType<typeof createAdminClient>,
		);
		mockStorageFrom.mockReturnValue({
			upload: mockStorageUpload,
			getPublicUrl: mockStorageGetPublicUrl,
			remove: mockStorageRemove,
		});
	});

	describe("ensureBucketExists", () => {
		it("does nothing if the bucket already exists", async () => {
			mockStorageGetBucket.mockResolvedValue({
				data: { id: "cms-images" },
				error: null,
			});

			await ensureBucketExists();

			expect(mockStorageGetBucket).toHaveBeenCalledWith("cms-images");
			expect(mockStorageCreateBucket).not.toHaveBeenCalled();
		});

		it("creates the bucket if getBucket returns an error", async () => {
			mockStorageGetBucket.mockResolvedValue({
				data: null,
				error: { message: "Bucket not found" },
			});
			mockStorageCreateBucket.mockResolvedValue({
				data: { name: "cms-images" },
				error: null,
			});

			await ensureBucketExists();

			expect(mockStorageGetBucket).toHaveBeenCalledWith("cms-images");
			expect(mockStorageCreateBucket).toHaveBeenCalledWith(
				"cms-images",
				expect.objectContaining({
					public: true,
				}),
			);
		});

		it("throws if bucket creation fails", async () => {
			mockStorageGetBucket.mockResolvedValue({
				data: null,
				error: { message: "Bucket not found" },
			});
			mockStorageCreateBucket.mockResolvedValue({
				data: null,
				error: { message: "Creation failed" },
			});

			await expect(ensureBucketExists()).rejects.toThrow(
				"Failed to automatically create storage bucket: Creation failed",
			);
		});
	});

	describe("uploadImage", () => {
		const validFile = new File(["dummy_content"], "photo.png", {
			type: "image/png",
		});

		it("throws an error if no file is provided", async () => {
			await expect(
				uploadImage(null as unknown as File, "folder"),
			).rejects.toThrow("No se seleccionó ningún archivo de imagen válido.");
		});

		it("throws an error if file size is 0", async () => {
			const emptyFile = new File([], "photo.png", { type: "image/png" });
			await expect(uploadImage(emptyFile, "folder")).rejects.toThrow(
				"No se seleccionó ningún archivo de imagen válido.",
			);
		});

		it("throws an error if file size exceeds the image limit", async () => {
			const largeFile = {
				size: MAX_IMAGE_SIZE_BYTES + 1,
				type: "image/png",
			} as File;
			await expect(uploadImage(largeFile, "folder")).rejects.toThrow(
				OVERSIZED_IMAGE_MESSAGE,
			);
		});

		it("throws an error if file type is not supported", async () => {
			const invalidFile = new File(["dummy_content"], "document.pdf", {
				type: "application/pdf",
			});
			await expect(uploadImage(invalidFile, "folder")).rejects.toThrow(
				"Formato de imagen no soportado. Use JPEG, PNG, WEBP o GIF.",
			);
		});

		it("uploads the file successfully and returns the public url", async () => {
			mockStorageGetBucket.mockResolvedValue({
				data: { id: "cms-images" },
				error: null,
			});
			mockStorageUpload.mockResolvedValue({
				data: { path: "folder/uuid.png" },
				error: null,
			});
			mockStorageGetPublicUrl.mockImplementation((path) => ({
				data: {
					publicUrl: `https://mockproject.supabase.co/storage/v1/object/public/cms-images/${path}`,
				},
			}));

			const url = await uploadImage(validFile, "professionals");

			expect(url).toBe(url); // or let's assert it starts with correct prefix and contains the random filename
			expect(url).toContain(
				"https://mockproject.supabase.co/storage/v1/object/public/cms-images/professionals/",
			);
			expect(mockStorageUpload).toHaveBeenCalledWith(
				expect.stringMatching(/^professionals\//),
				validFile,
				expect.objectContaining({ contentType: "image/png" }),
			);
		});

		it("throws if upload fails", async () => {
			mockStorageGetBucket.mockResolvedValue({
				data: { id: "cms-images" },
				error: null,
			});
			mockStorageUpload.mockResolvedValue({
				data: null,
				error: { message: "Upload server error" },
			});

			await expect(uploadImage(validFile, "professionals")).rejects.toThrow(
				"Error al subir la imagen al almacenamiento: Upload server error",
			);
		});
	});

	describe("deleteImage", () => {
		it("returns immediately if url is null or undefined", async () => {
			await deleteImage(null);
			expect(mockStorageRemove).not.toHaveBeenCalled();
		});

		it("returns immediately if url does not match our bucket prefix", async () => {
			await deleteImage("/profile.jpg");
			await deleteImage("https://external-host.com/photo.jpg");
			expect(mockStorageRemove).not.toHaveBeenCalled();
		});

		it("deletes the file if url matches the bucket domain and prefix", async () => {
			const url =
				"https://mockproject.supabase.co/storage/v1/object/public/cms-images/professionals/abc-123.png";
			mockStorageRemove.mockResolvedValue({
				data: [{ name: "professionals/abc-123.png" }],
				error: null,
			});

			await deleteImage(url);

			expect(mockStorageRemove).toHaveBeenCalledWith([
				"professionals/abc-123.png",
			]);
		});
	});

	describe("deleteImages", () => {
		const BUCKET_PREFIX =
			"https://mockproject.supabase.co/storage/v1/object/public/cms-images/";

		it("removes every bucket-hosted path in a single call", async () => {
			mockStorageRemove.mockResolvedValue({ data: [], error: null });

			await deleteImages([
				`${BUCKET_PREFIX}gallery/one.png`,
				`${BUCKET_PREFIX}gallery/two.png`,
				`${BUCKET_PREFIX}gallery/three.png`,
			]);

			// One request, not one per photo: purging a large category would
			// otherwise issue a round trip per image.
			expect(mockStorageRemove).toHaveBeenCalledTimes(1);
			expect(mockStorageRemove).toHaveBeenCalledWith([
				"gallery/one.png",
				"gallery/two.png",
				"gallery/three.png",
			]);
		});

		// Same guard as deleteImage: a static path or another host is skipped, not
		// turned into a delete against our bucket.
		it("skips urls that are not hosted in our bucket", async () => {
			mockStorageRemove.mockResolvedValue({ data: [], error: null });

			await deleteImages([
				"/galeria/1.jpg",
				"https://external-host.com/photo.jpg",
				null,
				`${BUCKET_PREFIX}gallery/kept.png`,
			]);

			expect(mockStorageRemove).toHaveBeenCalledWith(["gallery/kept.png"]);
		});

		it.each([
			["the list is empty", []],
			["nothing in it is ours", ["/galeria/1.jpg", null]],
		])("makes no request when %s", async (_case, urls) => {
			await deleteImages(urls as readonly (string | null)[]);

			expect(mockStorageRemove).not.toHaveBeenCalled();
		});

		// The rows these objects belonged to are already deleted by the time this
		// runs, so a Storage failure must not surface: the database is consistent
		// and no surviving row can point at a missing object.
		it("ignores a failed removal rather than throwing", async () => {
			mockStorageRemove.mockResolvedValue({
				data: null,
				error: { message: "Storage unavailable" },
			});

			await expect(
				deleteImages([`${BUCKET_PREFIX}gallery/one.png`]),
			).resolves.toBeUndefined();
		});
	});
});

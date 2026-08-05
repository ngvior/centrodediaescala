import "server-only";

import {
	ALLOWED_IMAGE_MIME_TYPES,
	MAX_IMAGE_SIZE_BYTES,
	OVERSIZED_IMAGE_MESSAGE,
} from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "cms-images";

/**
 * Ensures the 'cms-images' public bucket exists.
 * If it doesn't exist, it creates it programmatically using the admin client.
 */
export async function ensureBucketExists(): Promise<void> {
	const supabase = createAdminClient();

	// Try to get the bucket first
	const { error: getError } = await supabase.storage.getBucket(BUCKET_NAME);

	// If bucket doesn't exist, create it
	if (getError) {
		const { error: createError } = await supabase.storage.createBucket(
			BUCKET_NAME,
			{
				public: true,
				allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
				fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
			},
		);

		if (createError) {
			throw new Error(
				`Failed to automatically create storage bucket: ${createError.message}`,
			);
		}
	}
}

/**
 * Validates, renames, and uploads an image file to Supabase Storage.
 *
 * @param file The File object retrieved from FormData
 * @param folder The target directory prefix (e.g. 'professionals', 'activities', 'gallery')
 * @returns The absolute public URL string of the uploaded asset
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
	if (!file || file.size === 0) {
		throw new Error("No se seleccionó ningún archivo de imagen válido.");
	}

	// 1. Validate File Size. Defence in depth: an oversized body never reaches
	// this action (Next.js rejects it first), so the field also validates in the
	// browser. This guards non-form callers.
	if (file.size > MAX_IMAGE_SIZE_BYTES) {
		throw new Error(OVERSIZED_IMAGE_MESSAGE);
	}

	// 2. Validate MIME Type
	if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
		throw new Error(
			"Formato de imagen no soportado. Use JPEG, PNG, WEBP o GIF.",
		);
	}

	// 3. Ensure the target bucket exists
	await ensureBucketExists();

	// 4. Generate unique randomized path to prevent collisions
	const ext = file.type.split("/")[1] || "jpg";
	// Generate safe filename using standard Next crypto UUID
	const filename = `${crypto.randomUUID()}.${ext}`;
	const storagePath = `${folder}/${filename}`;

	const supabase = createAdminClient();

	// 5. Upload file using Service Role key
	const { error: uploadError } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(storagePath, file, {
			contentType: file.type,
			cacheControl: "31536000",
			upsert: false,
		});

	if (uploadError) {
		throw new Error(
			`Error al subir la imagen al almacenamiento: ${uploadError.message}`,
		);
	}

	// 6. Retrieve public URL
	const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
	if (!data?.publicUrl) {
		throw new Error("No se pudo generar la URL pública de la imagen.");
	}

	return data.publicUrl;
}

/**
 * Checks if the given URL is hosted on our Supabase Storage bucket and deletes it.
 * Safely ignores external links, static paths, or nulls.
 *
 * @param url The image URL to delete
 */
export async function deleteImage(url: string | null): Promise<void> {
	if (!url) return;

	const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!projectUrl) return;

	const marker = `${projectUrl}/storage/v1/object/public/${BUCKET_NAME}/`;

	// Only delete if the URL matches our bucket's domain and prefix
	if (url.startsWith(marker)) {
		const storagePath = url.substring(marker.length);
		if (!storagePath) return;

		const supabase = createAdminClient();
		await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
	}
}

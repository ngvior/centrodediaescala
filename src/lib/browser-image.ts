/**
 * Canvas re-encoding helpers. DOM-only, which the `client-only` marker enforces:
 * a server import fails at build time rather than at runtime, the same way
 * src/lib/supabase/storage.ts uses `server-only` in the other direction. The
 * pure geometry these rely on lives in src/lib/images.ts, which deliberately
 * carries no marker so both sides can share the upload limits.
 *
 * Both callers re-encode through the same path — the cropper to export a chosen
 * square, the gallery field to shrink a full photo — so the canvas handling,
 * the failure modes and the file naming are written once.
 */
import "client-only";

import {
	GALLERY_OUTPUT_MAX_EDGE,
	GALLERY_OUTPUT_MIME,
	GALLERY_OUTPUT_QUALITY,
	planFullFrameResize,
	type CropDrawPlan,
} from "@/lib/images";

export type EncodedImage = {
	file: File;
	/** Dimensions of the encoded output, not of the source. */
	width: number;
	height: number;
};

const EXTENSION_BY_MIME: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

/**
 * Re-encoding changes the format, so the stored name has to follow. A name that
 * kept `.png` while holding WEBP bytes would mislead anyone reading the bucket.
 */
export function toEncodedFileName(source: string, mimeType: string): string {
	const base = source.split("/").pop()?.replace(/\.[^./]+$/, "") ?? "imagen";
	const extension = EXTENSION_BY_MIME[mimeType] ?? "jpg";

	return `${base || "imagen"}.${extension}`;
}

/**
 * Loads a source into a detached image so the canvas reads full-resolution
 * pixels. Drawing from an on-screen element would export whatever the layout
 * scaled it down to.
 *
 * `remote` is required for an image already in the bucket: without the CORS
 * request the canvas is tainted and `toBlob` throws a SecurityError. A local
 * `blob:` URL does not need it.
 */
export function loadImage(
	src: string,
	remote = false,
): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();

		if (remote) {
			image.crossOrigin = "anonymous";
		}

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
		image.src = src;
	});
}

export async function renderPlanToFile(
	image: HTMLImageElement,
	plan: CropDrawPlan,
	mimeType: string,
	quality: number,
	fileName: string,
): Promise<EncodedImage> {
	const canvas = document.createElement("canvas");
	canvas.width = plan.canvasWidth;
	canvas.height = plan.canvasHeight;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("El navegador no pudo procesar la imagen.");
	}

	context.drawImage(
		image,
		plan.source.x,
		plan.source.y,
		plan.source.width,
		plan.source.height,
		0,
		0,
		plan.canvasWidth,
		plan.canvasHeight,
	);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, mimeType, quality),
	);

	if (!blob) {
		throw new Error("La imagen procesada quedó vacía. Probá de nuevo.");
	}

	return {
		file: new File([blob], fileName, { type: mimeType }),
		width: plan.canvasWidth,
		height: plan.canvasHeight,
	};
}

/**
 * Shrinks a photo to the gallery ceiling without touching its framing: the whole
 * frame is kept and the aspect ratio is preserved, because the public grid
 * renders previews uncropped.
 *
 * This is what lets an untouched phone or camera photo be uploaded at all. The
 * re-encoded file is what reaches the Server Action, so the original never has
 * to clear the body limit.
 */
export async function optimizeImageForGallery(
	file: File,
): Promise<EncodedImage> {
	const sourceUrl = URL.createObjectURL(file);

	try {
		const image = await loadImage(sourceUrl);
		const plan = planFullFrameResize(
			{ width: image.naturalWidth, height: image.naturalHeight },
			GALLERY_OUTPUT_MAX_EDGE,
		);

		return await renderPlanToFile(
			image,
			plan,
			GALLERY_OUTPUT_MIME,
			GALLERY_OUTPUT_QUALITY,
			toEncodedFileName(file.name, GALLERY_OUTPUT_MIME),
		);
	} finally {
		URL.revokeObjectURL(sourceUrl);
	}
}

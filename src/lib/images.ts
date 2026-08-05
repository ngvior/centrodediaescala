/**
 * Image upload limits shared by the browser field, the server upload helper and
 * the storage bucket. This module has no `server-only` marker on purpose: the
 * file input has to enforce the same ceiling client-side, and
 * src/lib/supabase/storage.ts cannot be imported from a Client Component.
 *
 * The ceiling comes from the Server Action body limit, not from Supabase. A body
 * above `serverActions.bodySizeLimit` is rejected by Next.js before the action
 * runs, so no server-side handler can ever report it. next.config.ts reserves
 * 2MB of body so a 1MB image plus the form's text fields always fits.
 */
export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

/** Human-readable form of MAX_IMAGE_SIZE_BYTES for user-facing copy. */
export const MAX_IMAGE_SIZE_LABEL = "1 MB";

export const ALLOWED_IMAGE_MIME_TYPES: string[] = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
];

/** Value for a file input's `accept` attribute. */
export const ACCEPTED_IMAGE_MIME_TYPES = ALLOWED_IMAGE_MIME_TYPES.join(",");

export const OVERSIZED_IMAGE_MESSAGE = `La imagen supera el máximo de ${MAX_IMAGE_SIZE_LABEL}. Elegí un archivo más liviano.`;

/**
 * Ceiling for a file that is going to be cropped. It is decoded in the browser
 * and re-encoded to CROP_OUTPUT_MAX_EDGE before upload, so it never touches the
 * Server Action body limit and a straight-from-the-phone photo is fine. The cap
 * only exists to keep a huge decode from stalling a low-end device.
 */
export const MAX_SOURCE_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_SIZE_LABEL = "12 MB";
export const OVERSIZED_SOURCE_IMAGE_MESSAGE = `La imagen supera el máximo de ${MAX_SOURCE_IMAGE_SIZE_LABEL}. Elegí un archivo más liviano.`;

export const ATTACH_CROP_FAILED_MESSAGE =
	"No se pudo adjuntar el recorte. Probá con otro navegador o subí una imagen ya cuadrada.";

/**
 * The public site renders professional photos inside a 140-180px circle with
 * `object-cover` (src/app/(public)/page.tsx), which centre-crops whatever it is
 * given. The stored asset therefore has to be square, and the admin picks which
 * square: anything else silently loses the sides of the photo.
 */
export const PROFESSIONAL_IMAGE_ASPECT_RATIO = 1;

/**
 * Longest edge of a cropped export. The widest render is 180px CSS, so 512
 * still covers 2x displays with room to spare while keeping the re-encoded file
 * far under MAX_IMAGE_SIZE_BYTES.
 */
export const CROP_OUTPUT_MAX_EDGE = 512;
export const CROP_OUTPUT_MIME = "image/jpeg";
export const CROP_OUTPUT_QUALITY = 0.9;

export type CropArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type CropDrawPlan = {
	/** Region of the source image to read, clamped to its real bounds. */
	source: CropArea;
	canvasWidth: number;
	canvasHeight: number;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Turns a cropper selection into the numbers a canvas needs.
 *
 * Split out from the cropper component because this is the part that can
 * actually be wrong: the selection arrives as fractional pixels and can sit a
 * hair outside the image after rounding, which makes `drawImage` read
 * transparent padding and produces a photo with a black or empty edge.
 *
 * Never upscales — a crop smaller than `maxEdge` gains bytes and no detail.
 */
export function planCropDraw(
	area: CropArea,
	image: { width: number; height: number },
	maxEdge: number = CROP_OUTPUT_MAX_EDGE,
): CropDrawPlan {
	const x = clamp(Math.round(area.x), 0, Math.max(image.width - 1, 0));
	const y = clamp(Math.round(area.y), 0, Math.max(image.height - 1, 0));
	const width = clamp(Math.round(area.width), 1, image.width - x);
	const height = clamp(Math.round(area.height), 1, image.height - y);

	const longestEdge = Math.max(width, height);
	const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;

	return {
		source: { x, y, width, height },
		canvasWidth: Math.max(Math.round(width * scale), 1),
		canvasHeight: Math.max(Math.round(height * scale), 1),
	};
}

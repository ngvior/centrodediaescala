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
